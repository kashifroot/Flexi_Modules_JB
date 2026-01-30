# -*- coding: utf-8 -*-
#################################################################################
#
#   Copyright (c) 2025-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>)
#    See LICENSE file for full copyright and licensing details.
#################################################################################
from odoo import models

class AccountInvoice(models.Model):
    _inherit = 'account.invoice'

    def action_invoice_draft(self):
        res = super().action_invoice_draft()
        self.env['autoprint.rule']._autoprint_on_action(records=self,action_name="Reset to Draft",model="account.invoice")
        return res
    
    def action_cancel(self):
        res = super().action_cancel()
        self.env['autoprint.rule']._autoprint_on_action(records=self,action_name="Cancel",model="account.invoice")
        return res
    
    # def action_post(self):
    #     res = super().action_post()
    #     self.env['autoprint.rule']._autoprint_on_action(records=self,action_name="Confirm",model="account.invoice")
    #     return res
    
    def action_invoice_open(self):
        res = super().action_invoice_open()
        self.env['autoprint.rule']._autoprint_on_action(records=self,action_name="Confirm",model="account.invoice")
        return res

class AccountPayment(models.Model):
    _inherit = 'account.payment'

    def action_validate_invoice_payment(self):
        res = super().action_validate_invoice_payment()
        self.env['autoprint.rule']._autoprint_on_action(
            records=self, action_name="Pay", model="account.payment")
        return res 
                     