// KONFIGURÁCIA SUPABASE
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 


const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    const { device, metric, from, to } = event.queryStringParameters;

    try {
        // 1. Získanie dát meraní
        let query = supabase
            .from('measurements')
            .select('casova_znacka, device_id, data')
            .gte('casova_znacka', from)
            .lte('casova_znacka', to)
            .order('casova_znacka', { ascending: true })
            .limit(10000);

        if (device && device !== 'all') {
            query = query.eq('device_id', device);
        }

        const { data, error } = await query;
        if (error) throw error;

        // 2. Pomocné dáta pre filtre (zariadenia a dostupné metriky v JSONB)
        // Pre výkon to v reálnej appke možno budete chcieť cache-ovať
        const devices = [...new Set(data.map(d => d.device_id))];
        const metrics = new Set();
        data.forEach(row => {
            if (row.data) Object.keys(row.data).forEach(k => metrics.add(k));
        });

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                data,
                devices,
                metrics: Array.from(metrics)
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};