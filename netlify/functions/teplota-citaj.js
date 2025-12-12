// teplota-citaj.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async () => {
    try {
        // AKTUALIZÁCIA: Získanie stĺpcov 'temperature' a 'humidity'
        // Zoradenie vzostupne (ascending: true) pre zobrazenie najstarších dát vľavo na grafe.
        const { data, error } = await supabase
            .from('readings')
            .select('created_at, temperature, humidity') // <--- ZMENA TU: Používame 'temperature' a 'humidity'
            .order('created_at', { ascending: true }) 
            .limit(100);

        if (error) throw error;

        // Vrátenie dát pre frontend
        const readings = data.map(item => ({
            time: new Date(item.created_at).getTime(), // Konverzia na milisekundy pre JS
            teplota: item.temperature, // Mapujeme 'temperature' na 'teplota' pre frontend logiku
            vlhkost: item.humidity,    // Mapujeme 'humidity' na 'vlhkost' pre frontend logiku
        }));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(readings),
        };
    } catch (error) {
        console.error('Chyba pri čítaní dát:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Chyba pri čítaní z databázy', details: error.message }),
        };
    }
};