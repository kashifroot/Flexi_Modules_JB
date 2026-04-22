# -*- coding: utf-8 -*-
#################################################################################
#
#   Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
#    See LICENSE file for full copyright and licensing details.
#################################################################################
from odoo import api, fields, models, _
import logging
from odoo.exceptions import ValidationError
from datetime import datetime, timedelta
_logger=logging.getLogger(__name__)

METHOD = [
    ('print-raw', 'Raw Commandset'),
    ('print-image', 'Image'),
    ('print-file', 'File'),
    ('print-complex', 'Raw+Image'),
]

class PrintJobs(models.Model):
    _name = "print.jobs"
    _description = "Print Jobs"

    host_id = fields.Char(string="Host ID", compute="_compute_host_id")
    printer_id = fields.Many2one('wk.printer', string="Printer")
    state = fields.Selection(selection=[('Queue', 'Queue'), ('Done', 'Sent'), ('Failed', 'Failed')], string='State', default='Queue')
    method = fields.Selection(selection=METHOD, string="Print What?", required=True)
    msg = fields.Text(string="Info")
    file_extension = fields.Char(string="File Extension")
    content = fields.Text(string="Content", required=True)

    @api.depends('printer_id')
    def _compute_host_id(self):
        for rec in self:
            rec.host_id = rec.printer_id.hostmachine_id.host_id

    def retry_print(self):
        if not self.printer_id:
            raise ValidationError('The Printer info is missing.\nThis may occur if the user have deleted the printer info from odoo.\nCreate a new print job.')
        for each_partner in self.printer_id.hostmachine_id.user_ids:
            message = {'type': 'print_direct',
                       'payload': {'method': 'print-job-cmd', 'host_id': self.printer_id.hostmachine_id.host_id, 'record_id': self.id, }}
            self.env['bus.bus'].sendone(
                (self._cr.dbname, 'res.partner', each_partner.partner_id.id), message)

    def create_notify_print_job(self, **kwargs):
        vals = {
                'printer_id': kwargs.get('printer_id').id,
                'method': kwargs.get('method'),
                'content': kwargs.get('content'),
                'file_extension': kwargs.get('file_extension')
            }
        new_print_job = self.create(vals)
        for each_partner in new_print_job.printer_id.hostmachine_id.user_ids:
            message = {'type': 'print_direct',
                       'payload': {'method': 'print-job-cmd', 'host_id': new_print_job.printer_id.hostmachine_id.host_id, 'record_id': new_print_job.id,}}
            self.env['bus.bus'].sendone(
                (self._cr.dbname, 'res.partner', each_partner.partner_id.id), message)

    def _cron_clean_print_jobs(self, days=3):
        for rec in self.search([]):
            if (datetime.datetime.now() - rec.create_date).days > days:
                rec.unlink()

    def _cron_renotify_queued_jobs(self, jobs=10, created_within=120):
        '''
        :param jobs: number of jobs to notify.
        :param created_within: takes minutes, compares from datetime.now() 
        '''
        created_before = (datetime.now() - timedelta(minutes=created_within)).strftime('%Y-%m-%d %H:%M:%S')
        for rec in self.search([('state', '=', 'Queue'), ('create_date', '>=', created_before)], limit=jobs):
            for each_partner in rec.printer_id.hostmachine_id.user_ids:
                message = {'type': 'print_direct',
                           'payload': {'method': 'print-job-cmd',
                                       'host_id': rec.printer_id.hostmachine_id.host_id, 'record_id': rec.id}}
                self.env['bus.bus'].sendone((self._cr.dbname, 'res.partner', each_partner.partner_id.id), message)
