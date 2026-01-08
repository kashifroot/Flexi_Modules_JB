# 1. Standard library imports
from datetime import date
import json
import dateutil.utils
import requests
# 2. Known third party imports (One per line sorted and split in python stdlib)
# 3. Odoo imports (odoo)
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError
# 4. Imports from Odoo modules (rarely, and only if necessary)
# 5. Local imports in the relative form
# 6. Unknown third party imports (One per line sorted and split in python stdlib)

class firstGroup(models.Model):
    _inherit = 'pos.order.line'

    scale_barcode = fields.Char()

class PosOrder(models.Model):
    _inherit = 'pos.order'

    def cancel_pos_order(self):
        for rec in self:
            for statement in rec.statement_ids:
                statement.button_cancel_reconciliation()
            rec.statement_ids.unlink()

            rec.picking_id.cancel_stock_picking()
            rec.picking_id.unlink()

            journals = rec.env['account.move'].search(
                [('ref', 'like', rec.picking_id.name), ('company_id', '=', rec.picking_id.company_id.id)])
            for journal in journals:
                journal.button_cancel()
            journals.unlink()

            rec.state = 'draft'