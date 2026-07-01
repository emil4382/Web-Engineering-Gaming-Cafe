// db error messages

'use strict';

function describeDbError(err, where = {}) {
  if ( !err) return 'Unbekannter Fehler.';

  const sub = Array.isArray(err.errors) ? err.errors.filter(Boolean) : [];
  const detail = sub.length
    ? sub.map( (e) => `${e.code || e.name || 'Error'}: ${e.message || e}` ).join( ' | ')
    : err.message || err.code || String(err );

  const code = err.code || (sub[ 0] && sub[0].code);
  const target = `${where.host || '?'}:${where.port || '?'}`;

  if (code === 'ECONNREFUSED') {
    return (
      `${detail}\n  → Keine Datenbank erreichbar auf ${target}. ` +
      'Starte MariaDB/MySQL (`sudo systemctl start mariadb`) oder `docker compose up`, dann erneut versuchen.'
    );
  }
  if (code === 'ER_ACCESS_DENIED_ERROR') {
    return `${detail}\n  → DB_USER/DB_PASSWORD in backend/.env passen nicht für ${target}.`;
  }
  if (code === 'ER_BAD_DB_ERROR') {
    return `${detail}\n  → Datenbank fehlt. Zuerst \`npm run db:setup\` ausführen.`;
  }
  return detail;
}

module.exports = { describeDbError  };
