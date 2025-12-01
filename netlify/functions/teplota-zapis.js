// teplota-zapis.js

const { createClient } = require('@supabase/supabase-js');

// Klient Supabase používa premenné prostredia
const supabaseUrl = process.env.SUPABASE_URL;
// Používame tajný Service Role Key, ktorý nikdy neuvidí klient (ESP32)
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 
const expectedApiKey = process.env.ESP32_API_KEY; // <-- Environmentálna premenná, ktorú musíš nastaviť na Netlify!

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Metóda nie je povolená' };
    }

    // -------------------------------------------------------------
    // KONTROLA AUTENTIFIKÁCIE: Netlify funkcia overuje ESP32 kľúč
    // -------------------------------------------------------------
    const actualApiKey = event.headers['esp32_api_key'];

    if (!actualApiKey || actualApiKey !== expectedApiKey) {
        // Ak kľúč chýba alebo je nesprávny, vrátime 401
        console.warn('Pokus o neautorizovaný prístup. Očakávaný kľúč:', expectedApiKey); 
        console.warn('Prijatý kľúč:', actualApiKey);
        
        return { 
            statusCode: 401, 
            body: JSON.stringify({ message: 'Neoprávnený prístup. Chýba alebo je nesprávny X-API-Key.' }) 
        };
    }
    // -------------------------------------------------------------

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