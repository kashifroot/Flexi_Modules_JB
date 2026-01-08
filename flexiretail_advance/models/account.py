# -*- coding: utf-8 -*-
#################################################################################
# Author      : Acespritech Solutions Pvt. Ltd. (<www.acespritech.com>)
# Copyright(c): 2012-Present Acespritech Solutions Pvt. Ltd.
# All Rights Reserved.
#
# This program is copyright property of the author mentioned above.
# You can`t redistribute it and/or modify it.
#
#################################################################################

from datetime import datetime

from odoo import models, api, fields, _
from odoo.addons.account.wizard.pos_box import CashBox
from odoo.tools.float_utils import float_round


class AccountTax(models.Model):
	_inherit = 'account.tax'
	
	def round_to_nearest_five_cents(self,amount):
		# Step 1: round DOWN to nearest 0.05
		base = float_round(
			amount,
			precision_rounding=0.05,
			rounding_method='DOWN'
		)
		
		# Step 2: inspect remainder safely
		diff = float_round(amount - base, precision_rounding=0.01)
		
		# Step 3: apply your business rules
		if diff >= 0.08:
			return float_round(base + 0.10, precision_rounding=0.05)
		elif diff >= 0.03:
			return float_round(base + 0.05, precision_rounding=0.05)
		
		return base
	
	@api.multi
	def compute_all(self, price_unit, currency=None, quantity=1.0, product=None, partner=None):
		res = super(AccountTax, self).compute_all(
			price_unit, currency, quantity, product, partner
		)
		
		# POS-only or controlled via context (recommended)
		# if self.env.context.get('round_5_cents'):
		res['total_excluded'] = self.round_to_nearest_five_cents(res['total_excluded'])
		res['total_included'] = self.round_to_nearest_five_cents(res['total_included'])
	
		return res

class account_journal(models.Model):
	_inherit = "account.journal"
	
	@api.model
	def name_search(self, name, args=None, operator='ilike', limit=100):
		if self._context.get('config_jr'):
			if self._context.get('journal_ids') and \
					self._context.get('journal_ids')[0] and \
					self._context.get('journal_ids')[0][2]:
				args += [['id', 'in', self._context.get('journal_ids')[0][2]]]
			else:
				return False;
		if self._context.get('from_delivery'):
			args += [['jr_use_for', '=', False]]
		return super(account_journal, self).name_search(name, args=args, operator=operator, limit=limit)
	
	shortcut_key = fields.Char('Shortcut Key')
	jr_use_for = fields.Selection([
		('loyalty', "Loyalty"),
		('gift_card', "Gift Card"),
		('gift_voucher', "Gift Voucher"),
		('rounding', "Rounding"),
		('credit', "Credit")
	], string="Method Use For",
		help='This payment method reserve for particular feature, that accounting entry will manage based on assigned features.')
	apply_charges = fields.Boolean("Apply Charges");
	fees_amount = fields.Float("Fees Amount");
	fees_type = fields.Selection(selection=[('fixed', 'Fixed'), ('percentage', 'Percentage')], string="Fees type",
	                             default="fixed")
	optional = fields.Boolean("Optional")


class AccountBankStatementLine(models.Model):
	_inherit = "account.bank.statement.line"
	
	@api.one
	@api.constrains('amount')
	def _check_amount(self):
		if not self._context.get('from_pos'):
			super(AccountBankStatementLine, self)._check_amount()
	
	@api.one
	@api.constrains('amount', 'amount_currency')
	def _check_amount_currency(self):
		if not self._context.get('from_pos'):
			super(AccountBankStatementLine, self)._check_amount_currency()
	
	is_money_in = fields.Boolean("Is Money In");
	is_money_out = fields.Boolean("Is Money Out");


class CashBoxIn(CashBox):
	_inherit = 'cash.box.in'
	
	@api.multi
	def _calculate_values_for_statement_line(self, record):
		res = super(CashBoxIn, self)._calculate_values_for_statement_line(record)
		if res:
			res.update({
				'is_money_in': True
			})
		return res


class CashBoxOut(CashBox):
	_inherit = 'cash.box.out'
	
	@api.multi
	def _calculate_values_for_statement_line(self, record):
		res = super(CashBoxOut, self)._calculate_values_for_statement_line(record)
		if res:
			res.update({
				'is_money_out': True
			})
		return res

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
