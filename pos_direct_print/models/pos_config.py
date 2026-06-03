# -*- coding: utf-8 -*-
#################################################################################
#
#   Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
#   See LICENSE file for full copyright and licensing details.
#   License URL : <https://store.webkul.com/license.html/>
#
#################################################################################

import uuid
from odoo import fields, models
from odoo.tools.translate import _
from escpos.printer import Dummy
from PIL import Image
from io import BytesIO
from ast import literal_eval
import base64

import logging
_logger = logging.getLogger(__name__)


class PosConfig(models.Model):
    _inherit = 'pos.config'

    use_direct_print = fields.Boolean(string='Use Direct Print')
    direct_printer_id = fields.Many2one(
        'wk.printer', string="Direct Printer", help="Direct Printer for print POS payment Receipt")
    receipt_print_auto = fields.Boolean(string='Automatic Receipt Printing via Direct Printer', default=False,
                                        help='The receipt will automatically be printed via Direct Printer at the open of Receipt Screen.')
    order_receipt_format = fields.Selection([('xml', 'XML Receipt'), ('default', 'Default Receipt')], string="Order Receipt Format", default='default', required=True)# no use in odoo v12 remove me

    def get_direct_printer_info(self):
        printer_info =self.direct_printer_id._get_printer_config()
        printer_info.update({
            'is_hostmachine_online':self.direct_printer_id.hostmachine_id.is_online,
            'pos_cashdrawer': self.direct_printer_id.pos_cashdrawer,
            'pending_print_jobs':len(self.env['print.jobs'].search([('printer_id', '=', self.direct_printer_id.id),('state', '!=', 'Done')])),
            'host_platform': self.direct_printer_id.hostmachine_id.platform or '',
        })
        return printer_info


class PrintJobs(models.Model):
    _inherit = "print.jobs"
    
    def create_print_and_cashdrawer_job(self, printer_id, method, content, file_extension=None, is_byte_stream=False):
        # openCashDrawer
        CD_KICK_2 = '\x1b\x70\x00\x32\x32'
        CD_KICK_5 = '\x1b\x70\x01\x32\x32'
        self.create_print_job(printer_id, 'print-raw', CD_KICK_2, None, False)
        self.create_print_job(printer_id, 'print-raw', CD_KICK_5, None, False)
        # for print 
        self.create_print_job(printer_id,method,content,file_extension,is_byte_stream)
        
    def create_print_job(self, printer_id, method, content, file_extension=None, is_byte_stream=False):
        # ----------------------------------------------------------------------
        # is_byte_stream:
        #   If True, pass a list of [encoding, byte-data] pairs instead of
        #   plain ESC/POS content.
        #
        #   Example:
        #       [
        #           ['utf-8', b'byte-data'],
        #           ['cp688', b'byte-data']
        #       ]
        # ----------------------------------------------------------------------
        if method == 'print-raw':
            content = content.replace("\x00", "[NULL]")
        vals = {
            'printer_id': printer_id,
            'method': method,
            'content': content,
            'file_extension': file_extension,
            # 'is_byte_stream': is_byte_stream,
        }
        new_print_job = self.create(vals)
        if new_print_job.method == 'print-complex':
            content_list = literal_eval(new_print_job.content)
            for i, item in enumerate(content_list):
                if item['type'] == 'image' and item['content']:
                    image_data = base64.b64decode(item['content'])
                    image_file = BytesIO(image_data)
                    img = Image.open(image_file)
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    if img.mode == 'RGBA':
                        background = Image.new('RGBA', img.size, (255, 255, 255, 255))
                        img = Image.alpha_composite(background, img)
                    img = img.convert('RGB')
                    try:
                        resample_filter = Image.Resampling.LANCZOS
                    except AttributeError:
                        resample_filter = Image.ANTIALIAS

                    max_width = 530
                    if img.width > max_width:
                        img.thumbnail((max_width, 9999), resample_filter)

                    img_bw = img.convert('1')
                    p = Dummy()
                    # p.profile.media['width']['pixels'] = img.width  # Matches actual image width
                    p.image(img_bw)
                    item['content'] = str(p.output)
            new_print_job.content = content_list

        if new_print_job.method == 'print-image':
            image_data = base64.b64decode(new_print_job.content)
            image_file = BytesIO(image_data)
            img = Image.open(image_file)
            if img.mode == 'P':
                img = img.convert('RGBA')
            if img.mode == 'RGBA':
                background = Image.new('RGBA', img.size, (255, 255, 255, 255))
                img = Image.alpha_composite(background, img)
            img = img.convert('RGB')
            try:
                resample_filter = Image.Resampling.LANCZOS
            except AttributeError:
                resample_filter = Image.ANTIALIAS

            max_width = 530
            if img.width > max_width:
                img.thumbnail((max_width, 9999), resample_filter)

            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_bytes = buffered.getvalue()

            new_print_job.content = base64.b64encode(img_bytes).decode('utf-8')

            
        for each_partner in new_print_job.printer_id.hostmachine_id.user_ids:
            message = {'type': 'print_direct',
                        'payload': {'method': 'print-job-cmd', 'host_id': new_print_job.printer_id.hostmachine_id.host_id, 'record_id':new_print_job.id}}
            self.env['bus.bus'].sendone((self._cr.dbname, 'res.partner', each_partner.partner_id.id), message)
        return new_print_job

class WkPrinter(models.Model):
    _inherit = "wk.printer"

    pos_cashdrawer = fields.Boolean('Cash Drawer (Point Of Sale)', default=True)
