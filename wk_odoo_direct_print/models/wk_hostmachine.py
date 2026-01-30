# -*- coding: utf-8 -*-
#################################################################################
#
#   Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
#    See LICENSE file for full copyright and licensing details.
#################################################################################
from odoo import api, fields, models, _
import logging
import json
import requests
import time
from odoo.exceptions import ValidationError, UserError
# from odoo.addons.hw_escpos.escpos import escpos
from ..lib import printer_info
from ..lib import platform_info
from ..lib.escpos import escpos

_logger=logging.getLogger(__name__)

class WkHostMachine(models.Model):
    _name = "wk.hostmachine"
    _description = "Host Machine"

    name = fields.Char(string="Name", required=True)
    description = fields.Char(string="Description", help="")
    host_id =  fields.Char(string="Host ID", required=True) # use hostname for unique id
    hostname =  fields.Char(string="Host Machine Name")
    platform =  fields.Selection(string="Operating System", selection=platform_info.PLATFORM)
    printer_ids = fields.One2many('wk.printer', 'hostmachine_id', string='Printer')
    user_ids = fields.Many2many('res.users', string='Grant Access to:', default=lambda self:self.env.user)
    is_online = fields.Boolean(string="Status")

    def get_sys_info(self):
        self.is_online = False
        if not self.host_id:
            raise UserError('The Host ID is missing.')
        if not self.user_ids:
            raise UserError('No users are granted access to this Host machine.')
        for each_partner in self.user_ids:
            message = {'type': 'print_direct',
                       'payload': {'method': 'sys-info', 'host_id': self.host_id}}
            self.env['bus.bus'].sendone((self._cr.dbname, 'res.partner', each_partner.partner_id.id), message)
        time.sleep(4)
        return {
            'type': 'ir.actions.client',
            'tag': 'reload',
        }
    
    def _cron_sys_info(self):
        for rec in self.search([]):
            rec.get_sys_info()
    
    def get_printers(self):
        if not self.host_id:
            raise UserError('The Host ID is missing.')
        if not self.user_ids:
            raise UserError('No users are granted access to this Host machine.')
        message = {'type': 'print_direct',
                   'payload': {'method': 'get-printers', 'host_id': self.host_id}}
        # _logger.info(f"\n\n\n message======={message}\n\n\n")
        for each_partner in self.user_ids:
            self.env['bus.bus'].sendone((self._cr.dbname, 'res.partner', each_partner.partner_id.id), message)
        time.sleep(4)
        return {
                'type': 'ir.actions.client',
                'tag': 'reload',
            }

class WkPrinter(models.Model):
    _name = "wk.printer"
    _description = "Printer"

    name = fields.Char(string="Name", required=True)
    state = fields.Selection(selection=[('Active', 'Active'), ('Inactive', 'Inactive')], string='State', default='Inactive', required=True)
    description = fields.Char(string="Description", help="Description of the printer. eg: Office printer")
    idVendor = fields.Char(string="Vendor ID")
    idProduct = fields.Char(string="Product ID")
    paper_width = fields.Integer(string="Paper Width", default=603)
    paper_height = fields.Integer(string="Paper Height", default=1703)
    interface = fields.Char(string="Interface") # System Defined | Raw(USB)
    printerType = fields.Selection(string="Printer Type", selection=printer_info.PRINTER_TYPE)
    printerType_domain = fields.Char(string="File Type", compute="_compute_printerType_domain")
    report_ids = fields.Many2many('ir.actions.report', 'wk_printer_report_rel', 'printer_id', 'report_id', string="Reports" ,domain="[('printerType', '=', printerType_domain)]")
    hostmachine_id = fields.Many2one('wk.hostmachine', string='Host Machine', ondelete="cascade")
    platform =  fields.Selection(related="hostmachine_id.platform", string="Operating System", selection=platform_info.PLATFORM)

    @api.depends('printerType')
    def _compute_printerType_domain(self):
        for res in self:
            if res.printerType:
                arr = res.printerType.split(' ')
                res.printerType_domain = arr[0]
            else:
                res.printerType_domain = ''

    def toggle_is_active(self):
        for rec in self:
            if not rec.printerType:
                raise ValidationError('Please set the Printer Type first.')
            rec.state = 'Inactive' if rec.state == 'Active' else 'Active'
    
    def _get_printer_config(self):
        return {
            'host_id' : self.hostmachine_id.host_id,
            'name' : self.name,
            'idVendor' : self.idVendor,
            'idProduct' : self.idProduct,
            'printerType' : self.printerType,
            'paper_width' : self.paper_width,
            'paper_height' : self.paper_height,
        }

    def test_printer(self):
        if not self.printerType:
            raise ValidationError('Please set the Printer Type first.')
        vals = self._get_printer_config()
        wiz = self.env['wizard.test.printer'].create(vals)
        view = self.env.ref('wk_odoo_direct_print.wizard_test_printer_form')

        return {
            'name': _(self.name),
            'type': 'ir.actions.act_window',
            'view_type': 'form',
            'view_mode': 'form',
            'res_model': 'wizard.test.printer',
            'views': [(view.id, 'form')],
            'target': 'new',
            'res_id': wiz.id,
        }
    
    def get_esc_command_set(self, data):
        printer = escpos.Escpos()
        printer.receipt(data.get("data"))
        return printer.esc_commands

