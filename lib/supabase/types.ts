// Database type definitions for type safety
export interface Vehicle {
  id: string;
  type: string;
  location: string;
  fuel_tanks: number;
  gps_required: number;
  fuel_sensors: number;
  day: number;
  time_slot: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  created_at?: string;
  updated_at?: string;
  // Enhanced registration fields
  registration_number?: string;
  vin_number?: string;
  engine_number?: string;
  chassis_number?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  fuel_type?: string;
  owner_name?: string;
  owner_contact?: string;
  registration_date?: string;
  registration_expiry?: string;
  installation_status?: string;
  installation_notes?: string;
  technician_assigned?: string;
  gps_device_id?: string;
  fuel_sensor_ids?: string[];
  installation_date?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  tags?: string[];
  priority?: string;
  notes?: string;
  start_date?: string;
  end_date?: string;
  duration_days?: number;
}

export interface Location {
  id: string;
  name: string;
  duration: string;
  vehicles: number;
  gps_devices: number;
  fuel_sensors: number;
  created_at?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  specializations: string[];
  completion_rate: number;
  average_task_time: number;
  quality_score: number;
  created_at?: string;
}

export interface Task {
  id: string;
  vehicle_id?: string;
  name: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
  priority: 'High' | 'Medium' | 'Low';
  assigned_to: string;
  estimated_duration?: number;
  actual_duration?: number;
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  completed_at?: string;
  tags?: string[];
  depends_on?: string[];
  created_by?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  task_id: string;
  text: string;
  author: string;
  created_at: string;
}

export interface ProjectSettings {
  id: string;
  project_start_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleRegistrationHistory {
  id: string;
  vehicle_id: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by: string;
  change_reason?: string;
  created_at?: string;
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  document_type: string;
  document_name: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  expiry_date?: string;
  is_required?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleMaintenance {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description?: string;
  scheduled_date?: string;
  completed_date?: string;
  technician?: string;
  cost?: number;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}