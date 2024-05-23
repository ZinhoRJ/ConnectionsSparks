const { Client } = require('pg');

// ATENÇÃO GALERINHA DO GITHUB, MUDE AQUI CASO QUEIRA TESTAR SEUS PRÓPRIOS BANCOS
const client = new Client({
    user: 'postgres',
    password: 'Fecip2024@',
    host: 'localhost',
    port: 5432, // Porta padrão do PostgreSQL
    database: 'postgres',
});

client.connect() //a conexão já foi feita, agora as querys estão prontas para serem requisitadas
    .then(() => console.log('Conexão com o banco de dados bem-sucedida!'))
    .catch(err => console.error('Erro na conexão:', err));

client.query('SELECT count(*) FROM formulario', (err, result) => { //query básica pra contar o número de tuplas presentes na nossa tabelinha
    if (err) throw err;
    const rowCount = result.rows[0].count;
    console.log(`Número de linhas: ${rowCount}`);
});

module.exports = client;