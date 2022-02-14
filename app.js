const { parse, deparse } = require('pgsql-parser');

const knex = require('knex')({
  client: 'postgresql',
  connection: {
    host: 'localhost',
    port: '5432',
    database: 'paradigm',
    user: 'paradigm',
    password: 'paradigm',
    statement_timeout: 10000
  }
})

function hello() {
  //
}

(async () => {
  const query = `SELECT
  "document_summary".*
  FROM (
   SELECT
    cf."documentId" as id
   FROM
    "categories_feed" AS "cf"

   WHERE
    "cf"."applicationId" = 'a81ea2f0-1945-11eb-bf19-d7fb09213370'
    AND "cf"."categoryId" = '2208fa70-8043-11eb-94f7-6324659b1ea6'

   ORDER BY
    "cf"."revisedAt" DESC
   LIMIT 100 OFFSET 0) docs
   JOIN document_summary ON document_summary.id = docs.id
  ORDER BY
   "document_summary"."revisedAt" DESC;`

  // Attempt parsing query to make sure it's valid SQL.
  try {
    const stmts = parse(query)
  } catch {
    console.log(e)
    process.exit(1)
  }

  // Execute query then grab column meta data from response
  
  const results = await knex.raw(query)
  const fields = results['fields']
  const dataTypeIds = fields.map(field => field.dataTypeID)
  const columnIDS = fields.map(field => field.columnID)
  const tableID = fields[0].tableID

  // Query pg_attribute and pg_class tables to get column data type.
  const { rows } = await knex.raw(`SELECT a.attname as "columnName", format_type(a.atttypid, a.atttypmod) AS "dataType", (not attnotnull) as nullable
                FROM pg_attribute a JOIN pg_class b ON a.attrelid = b.oid
                WHERE b.oid = ? AND a.attnum = ANY(?);`, [tableID, columnIDS])


  // Display 
  console.log(rows)
  process.exit(0)
})()