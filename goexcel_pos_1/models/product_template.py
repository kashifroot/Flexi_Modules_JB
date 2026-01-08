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

class ProductTemplateInherit(models.Model):
    _inherit = 'product.template'
    _order = 'order_number'

    #  Yulia 21012025 only additional field by kenny, jb no need
    # item_code = fields.Char(placeholder='IMAC-8-10-F3A1-10')
    order_number = fields.Char()
    second_name = fields.Char()
    third_name = fields.Char()

    # def _generate_order_by(self, order_spec, query):
    #     return """
    #     ORDER BY
    #     CASE
    #         WHEN order_number = 0 OR order_number IS NULL THEN 1  -- Place 0s and NULLs at the end
    #         ELSE 0  -- Sort other values normally
    #     END,
    #     order_number ASC,
    #     CASE
    #         WHEN order_number = 0 OR order_number IS NULL THEN name  -- Sort by name when order_number is 0 or NULL
    #     END
    #     """