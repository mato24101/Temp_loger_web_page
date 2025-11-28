// teplota-zapis.js

const { createClient } = require('@supabase/supabase-js');

// Klient Supabase používa premenné prostredia
const supabaseUrl = process.env.SUPABASE_URL;
// Používame tajný Service Role Key, ktorý nikdy neuvidí klient (ESP32)
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Metóda nie je povolená' };
    }

    try {
        const data = JSON.parse(event.body);
        const { teplota } = data; // Očakávame dáta vo formáte {"teplota": 25.5}

        if (teplota === undefined) {
             return { statusCode: 400, body: 'Chýba pole "teplota"' };
        }

        // Vloženie dát do tabuľky 'readings'
        const { error } = await supabase
            .from('readings')
            .insert({ value: parseFloat(teplota) }); // created_at sa pridá automaticky

        if (error) throw error;

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Zápis úspešný' }),
        };
    } catch (error) {
        console.error('Chyba pri zápise dát:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Interná chyba servera', details: error.message }),
        };
    }
};