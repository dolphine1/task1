-- Create passenger_queue table
CREATE TABLE passenger_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_type TEXT NOT NULL CHECK (passenger_type IN ('vip', 'elderly', 'regular', 'standby')),
  arrival_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seat_preference TEXT,
  boarding_time TIMESTAMPTZ,
  queue_position INTEGER,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'boarding', 'boarded', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_passenger_queue_vehicle_id ON passenger_queue(vehicle_id);
CREATE INDEX idx_passenger_queue_status ON passenger_queue(status);
CREATE INDEX idx_passenger_queue_type_arrival ON passenger_queue(passenger_type, arrival_time);

-- Enable Row Level Security
ALTER TABLE passenger_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on passenger_queue" 
ON passenger_queue FOR ALL 
USING (true);
