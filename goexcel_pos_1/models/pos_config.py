from datetime import datetime
import pytz
from odoo import api, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    @api.depends('session_ids')
    def _compute_last_session(self):
        PosSession = self.env['pos.session']
        for pos_config in self:
            session = PosSession.search_read(
                [('config_id', '=', pos_config.id), ('state', '=', 'closed')],
                ['cash_register_balance_end_real', 'stop_at'],
                order="stop_at desc", limit=1)
            if session:
                pos_config.last_session_closing_cash = session[0]['cash_register_balance_end_real']
                utc = pytz.timezone('UTC')
                timezone = pytz.timezone(self._context.get('tz') or self.env.user.tz or 'UTC')
                stop_at = session[0]['stop_at'] or datetime.utcnow()
                pos_config.last_session_closing_date = utc.localize(stop_at).astimezone(timezone).date()
            else:
                pos_config.last_session_closing_cash = 0
                pos_config.last_session_closing_date = False