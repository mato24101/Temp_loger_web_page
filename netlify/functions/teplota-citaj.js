// teplota-citaj.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async () => {
    try {
        // Získanie posledných 100 záznamov, zoradených od najnovších
        const { data, error } = await supabase
            .from('readings')
            .select('created_at, value') // Vyberieme len stĺpce, ktoré potrebujeme
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        // Vrátenie dát pre frontend
        const readings = data.map(item => ({
            time: new Date(item.created_at).getTime(), // Konverzia na milisekundy pre JS
            value: item.value,
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