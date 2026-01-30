# -*- coding: utf-8 -*-
#################################################################################
#
#    Copyright (c) 2017-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
#    You should have received a copy of the License along with this program.
#    If not, see <https://store.webkul.com/license.html/>
#################################################################################

from odoo import http
from odoo.http import request
import logging
import base64
import tempfile

class Report(http.Controller):

    @http.route('/direct-print/attachment-info', type='json', auth="user", csrf=False, methods=['POST'])
    def attachment_info(self, id):
        attachment = request.env['ir.attachment'].sudo().search([('id', '=', id)])
        default_printer = request.env['default.printer']
        return_data = {
            'success' : True,
        }
        if attachment:
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
                method = 'print-file'
            elif attachment.name[-4:] in ['.zpl', '.ZPL']:
                default_printers = default_printer.search([('file_type', '=', 'ZPL')])
                temp = tempfile.NamedTemporaryFile(suffix='.txt')
                with open(temp.name, 'wb') as file:
                    file.write(base64.b64decode(attachment.datas))
                with open(temp.name, 'r') as file:
                    contentCode = file.read()
                    file_extension = None
                    method = 'print-raw'
            if not default_printers.printer_ids:
                return {
                    'success' : False,
                    'msg' : 'Default Printer Not Configured for this attachment type.\nGo to: Print Direct > Configuration > Default Printer',
                }
            for printer in default_printers.printer_ids:
                vals = {
                    'printer_id': printer,
                    'method': method,
                    'content': contentCode,
                    'file_extension': file_extension
                }
                request.env['print.jobs'].create_notify_print_job(**vals)
        return return_data
