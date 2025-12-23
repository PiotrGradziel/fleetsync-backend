require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend'); // Import the email tool

const app = express();
app.use(cors());
app.use(express.json());

// 1. Setup Database Connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Setup Email Connection
const resend = new Resend(process.env.RESEND_API_KEY);

// TEST ROUTE
app.get('/', (req, res) => {
  res.send('FleetSync Backend is Active & Email Ready!');
});

// GET ALL VEHICLES
app.get('/api/vehicles', async (req, res) => {
  const { data, error } = await supabase.from('vehicles').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ADD VEHICLE + SEND EMAIL ALERT
app.post('/api/vehicles', async (req, res) => {
  const { reg_number, make, type, mot_expiry } = req.body;

  // A. Add to Database
  const { data, error } = await supabase
    .from('vehicles')
    .insert([{ reg_number, make, type, mot_expiry, status: 'On Road' }])
    .select();

  if (error) return res.status(500).json({ error: error.message });

  // B. Send Email Alert
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev', // MUST use this default email for free tier
      to: 'fleetsyncuk@gmail.com',   
      subject: `New Vehicle Added: ${reg_number}`,
      html: `
        <h1>New Vehicle Detected 🚛</h1>
        <p>A new vehicle has been added to the FleetSync database.</p>
        <ul>
          <li><strong>Reg:</strong> ${reg_number}</li>
          <li><strong>Make:</strong> ${make}</li>
          <li><strong>MOT Expiry:</strong> ${mot_expiry}</li>
        </ul>
        <p><em>Check the dashboard for full details.</em></p>
      `
    });
    console.log("Email alert sent successfully!");
  } catch (emailError) {
    console.error("Email failed:", emailError);
    // We don't stop the request just because email failed, so we continue.
  }

  res.json(data[0]);
});

// DELETE VEHICLE
app.delete('/api/vehicles/:id', async (req, res) => {
  const { error } = await supabase.from('vehicles').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

// UPDATE STATUS
app.put('/api/vehicles/:id', async (req, res) => {
  const { status } = req.body;
  const { data, error } = await supabase
    .from('vehicles')
    .update({ status })
    .eq('id', req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});