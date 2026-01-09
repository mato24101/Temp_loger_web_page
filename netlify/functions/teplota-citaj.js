// teplota-citaj.js
// FUNKCIA PRISPÔSOBENÁ PRE SCHÉMU S JSONB DÁTAMI
// Tabuľka: measurements, Stĺpce: casova_znacka, device_id, data (JSONB)

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

// Maximálny limit záznamov
const DATA_LIMIT = 2000; 

exports.handler = async (event) => {
    try {
        // Získanie filtrov z query parametrov
        const { from, to, deviceId } = event.queryStringParameters || {};

        // Log pre overenie, že funkcia sa dostala sem
        console.log(`Pripravujem dopyt Supabase. Filtre: Od=${from || 'žiadny'}, Do=${to || 'žiadny'}, DeviceID=${deviceId || 'žiadny'}. Limit: ${DATA_LIMIT}`);

        let query = supabase
            .from('measurements') // Používame novú tabuľku
            .select('casova_znacka, device_id, data'); // Nové stĺpce

        // Aplikovanie filtra podľa device_id
        if (deviceId) {
            query = query.eq('device_id', deviceId); // Filtrovanie zariadenia
        }

        // Aplikovanie časových filtrov Supabase
        if (from) {
            query = query.gte('casova_znacka', from);
        }
        if (to) {
            query = query.lte('casova_znacka', to);
        }

        // Aplikujeme zoradenie (najstaršie vľavo) a limit 
        const { data, error } = await query
            .order('casova_znacka', { ascending: true }) 
            .limit(DATA_LIMIT); 

        if (error) throw error;
        
        console.log(`Úspešne načítaných záznamov: ${data.length}`);

        // 2. Parsuje JSONB stĺpec 'data' a premapuje dáta do formátu pre frontend
        const readings = data.map(item => {
            // Predpokladáme, že data.JSONB obsahuje 'teplota' a 'vlhkost'
            const parsedData = item.data; 

            return {
                time: new Date(item.casova_znacka).getTime(), // Používame casova_znacka
                deviceId: item.device_id,
                // Priamo prenášame hodnoty z JSONB stĺpca 'data'
                teplota: parsedData.teplota || null, 
                vlhkost: parsedData.vlhkost || null, 
                // Ak by ste mali viac premenných, pridajte ich sem:
                // tlak: parsedData.tlak || null,
            };
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(readings),
        };
    } catch (error) {
        // Log chyby, ak nastane problém so Supabase
        console.error('CHYBA SUPABASE ALEBO FUNKCIE:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Chyba pri čítaní z databázy', details: error.message }),
        };
    }
};