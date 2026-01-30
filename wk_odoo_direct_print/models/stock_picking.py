# -*- coding: utf-8 -*-
#################################################################################
#
#   Copyright (c) 2025-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
#    See LICENSE file for full copyright and licensing details.
#################################################################################
from odoo import api, fields, models, _
import logging
import base64
import tempfile

_logger=logging.getLogger(__name__)

class PickingType(models.Model):
    _inherit = "stock.picking.type"

    auto_printdirect_carrier_labels = fields.Boolean(
        "Auto PrintDirect Carrier Labels",
        help="The attachment name must include 'Label'. Note this requires a printer to be assigned based on the attachment type.")
    auto_printdirect_export_documents = fields.Boolean(
        "Auto PrintDirect Export Documents",
        help="The attachment name must include 'ShippingDoc'. Note this requires a printer to be assigned based on the attachment type. ")

class StockPicking(models.Model):
    _inherit = "stock.picking"

    @api.returns('mail.message', lambda value: value.id)
    def message_post(self, **kwargs):
        message = super(StockPicking, self).message_post(**kwargs)
        allowed_company = self.company_id
        for attachment in message.attachment_ids:
            print_flag = False
            attachments_name = attachment.name
            if self.picking_type_id.auto_printdirect_carrier_labels and 'Label' in attachments_name:
                print_flag = True
            elif self.picking_type_id.auto_printdirect_export_documents and 'ShippingDoc' in attachments_name:
                print_flag = True
            if print_flag:
                default_printer = self.env['default.printer']
                default_printers = None
                if attachment.name[-4:] in ['.pdf', '.PDF']:
                    default_printers = default_printer.search([('file_type', '=', 'PDF')])
                    contentCode = attachment.datas
                    file_extension = 'pdf'
                    method = 'print-file'
                elif attachment.name[-4:] in ['.png', '.PNG', '.jpg', '.JPG']:
                    default_printers = default_printer.search([('file_type', '=', 'Image')])
                    contentCode = attachment.datas
                    file_extension = attachment.name[-3:].lower()
                    method = 'print-image'
                elif attachment.name[-4:] in ['.zpl', '.ZPL']:
                    default_printers = default_printer.search([('file_type', '=', 'ZPL')])
                    temp = tempfile.NamedTemporaryFile(suffix='.txt')
                    with open(temp.name, 'wb') as file:
                        file.write(base64.b64decode(attachment.datas))
                    with open(temp.name, 'r') as file:
                        contentCode = file.read()
                        file_extension = None
                        method = 'print-raw'
                printer_ids = default_printers.printer_ids
                filtered_printers = []
                for printer in printer_ids:
                    if list(set([each.id for each in printer.company_ids]) & set([allowed_company.id])):
                        filtered_printers.append(printer)
                for printer in filtered_printers:
                    if self.env.uid not in [user.id for user in printer.hostmachine_id.user_ids]:
                        continue
                    vals = {
                        'printer_id': printer,
                        'method': method,
                        'content': contentCode,
                        'file_extension': file_extension
                    }
                    self.env['print.jobs'].create_notify_print_job(**vals)
        return message

    def action_cancel(self):
        res = super().action_cancel()
        self.env['autoprint.rule']._autoprint_on_action(records=self,action_name="Cancel",model="stock.picking")
        return res

    def button_validate(self):
        res = super().button_validate()
        self.env['autoprint.rule']._autoprint_on_action(records=self,action_name="Validate",model="stock.picking")
        return res

    def send_to_shipper(self):
        res = super().send_to_shipper()
        self.env['autoprint.rule']._autoprint_on_action(records=self,action_name="Send to Shipper",model="stock.picking")
        return res

    def put_in_pack(self):
        res = super().put_in_pack()
        self.env['autoprint.rule']._autoprint_on_action(records=self,action_name="Put in Pack",model="stock.picking")
        return res
