# -*- coding: utf-8 -*-
#################################################################################
#
#   Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
#    See LICENSE file for full copyright and licensing details.
#################################################################################
from odoo import fields, models, _
import logging

_logger=logging.getLogger(__name__)

ATTACHMENT_FILE = [
    ('ZPL', 'ZPL File'),
    ('PDF', 'PDF File'),
    ('Image', 'Image File'),
]

class DefaultPrinter(models.Model):
    _name = "default.printer"
    _description = "Default Printer"

    file_type = fields.Selection(selection=ATTACHMENT_FILE, string="Attachment Type", required=True)
    printer_ids = fields.Many2many('wk.printer', string="Printers", ondelete="cascade")
