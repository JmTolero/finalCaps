/**
 * Comprehensive Philippine Cities/Municipalities and Provinces Data
 * Organized by region and province for accurate delivery zone matching
 */

export const PHILIPPINE_PROVINCES = [
  // National Capital Region
  { code: 'NCR', name: 'Metro Manila', region: 'NCR' },
  
  // Region I - Ilocos Region
  { code: 'ILN', name: 'Ilocos Norte', region: 'Region I' },
  { code: 'ILS', name: 'Ilocos Sur', region: 'Region I' },
  { code: 'LUN', name: 'La Union', region: 'Region I' },
  { code: 'PAN', name: 'Pangasinan', region: 'Region I' },
  
  // Region II - Cagayan Valley
  { code: 'BTN', name: 'Batanes', region: 'Region II' },
  { code: 'CAG', name: 'Cagayan', region: 'Region II' },
  { code: 'ISA', name: 'Isabela', region: 'Region II' },
  { code: 'NUV', name: 'Nueva Vizcaya', region: 'Region II' },
  { code: 'QUI', name: 'Quirino', region: 'Region II' },
  
  // Region III - Central Luzon
  { code: 'AUR', name: 'Aurora', region: 'Region III' },
  { code: 'BAN', name: 'Bataan', region: 'Region III' },
  { code: 'BUL', name: 'Bulacan', region: 'Region III' },
  { code: 'NUE', name: 'Nueva Ecija', region: 'Region III' },
  { code: 'PAM', name: 'Pampanga', region: 'Region III' },
  { code: 'TAR', name: 'Tarlac', region: 'Region III' },
  { code: 'ZMB', name: 'Zambales', region: 'Region III' },
  
  // Region IV-A - CALABARZON
  { code: 'BTG', name: 'Batangas', region: 'Region IV-A' },
  { code: 'CAV', name: 'Cavite', region: 'Region IV-A' },
  { code: 'LAG', name: 'Laguna', region: 'Region IV-A' },
  { code: 'QUE', name: 'Quezon', region: 'Region IV-A' },
  { code: 'RIZ', name: 'Rizal', region: 'Region IV-A' },
  
  // Region IV-B - MIMAROPA
  { code: 'MAD', name: 'Marinduque', region: 'Region IV-B' },
  { code: 'MDC', name: 'Mindoro Occidental', region: 'Region IV-B' },
  { code: 'MDR', name: 'Mindoro Oriental', region: 'Region IV-B' },
  { code: 'PLW', name: 'Palawan', region: 'Region IV-B' },
  { code: 'ROM', name: 'Romblon', region: 'Region IV-B' },
  
  // Region V - Bicol Region
  { code: 'ALB', name: 'Albay', region: 'Region V' },
  { code: 'CAN', name: 'Camarines Norte', region: 'Region V' },
  { code: 'CAS', name: 'Camarines Sur', region: 'Region V' },
  { code: 'CAT', name: 'Catanduanes', region: 'Region V' },
  { code: 'MAS', name: 'Masbate', region: 'Region V' },
  { code: 'SOR', name: 'Sorsogon', region: 'Region V' },
  
  // Region VI - Western Visayas
  { code: 'AKL', name: 'Aklan', region: 'Region VI' },
  { code: 'ANT', name: 'Antique', region: 'Region VI' },
  { code: 'CAP', name: 'Capiz', region: 'Region VI' },
  { code: 'GUI', name: 'Guimaras', region: 'Region VI' },
  { code: 'ILI', name: 'Iloilo', region: 'Region VI' },
  { code: 'NEC', name: 'Negros Occidental', region: 'Region VI' },
  
  // Region VII - Central Visayas
  { code: 'BOH', name: 'Bohol', region: 'Region VII' },
  { code: 'CEB', name: 'Cebu', region: 'Region VII' },
  { code: 'NEG', name: 'Negros Oriental', region: 'Region VII' },
  { code: 'SIG', name: 'Siquijor', region: 'Region VII' },
  
  // Region VIII - Eastern Visayas
  { code: 'BIL', name: 'Biliran', region: 'Region VIII' },
  { code: 'EAS', name: 'Eastern Samar', region: 'Region VIII' },
  { code: 'LEY', name: 'Leyte', region: 'Region VIII' },
  { code: 'NSA', name: 'Northern Samar', region: 'Region VIII' },
  { code: 'WSA', name: 'Western Samar', region: 'Region VIII' },
  { code: 'SLE', name: 'Southern Leyte', region: 'Region VIII' },
  
  // Region IX - Zamboanga Peninsula
  { code: 'ZAN', name: 'Zamboanga del Norte', region: 'Region IX' },
  { code: 'ZAS', name: 'Zamboanga del Sur', region: 'Region IX' },
  { code: 'ZSI', name: 'Zamboanga Sibugay', region: 'Region IX' },
  
  // Region X - Northern Mindanao
  { code: 'BUK', name: 'Bukidnon', region: 'Region X' },
  { code: 'CAM', name: 'Camiguin', region: 'Region X' },
  { code: 'LAN', name: 'Lanao del Norte', region: 'Region X' },
  { code: 'MSC', name: 'Misamis Occidental', region: 'Region X' },
  { code: 'MSR', name: 'Misamis Oriental', region: 'Region X' },
  
  // Region XI - Davao Region
  { code: 'COM', name: 'Compostela Valley', region: 'Region XI' },
  { code: 'DAV', name: 'Davao del Norte', region: 'Region XI' },
  { code: 'DAS', name: 'Davao del Sur', region: 'Region XI' },
  { code: 'DAO', name: 'Davao Occidental', region: 'Region XI' },
  { code: 'DAE', name: 'Davao Oriental', region: 'Region XI' },
  
  // Region XII - SOCCSKSARGEN
  { code: 'NCO', name: 'North Cotabato', region: 'Region XII' },
  { code: 'SAR', name: 'Sarangani', region: 'Region XII' },
  { code: 'SCO', name: 'South Cotabato', region: 'Region XII' },
  { code: 'SUK', name: 'Sultan Kudarat', region: 'Region XII' },
  
  // Region XIII - Caraga
  { code: 'AGN', name: 'Agusan del Norte', region: 'Region XIII' },
  { code: 'AGS', name: 'Agusan del Sur', region: 'Region XIII' },
  { code: 'DIN', name: 'Dinagat Islands', region: 'Region XIII' },
  { code: 'SUN', name: 'Surigao del Norte', region: 'Region XIII' },
  { code: 'SUR', name: 'Surigao del Sur', region: 'Region XIII' },
  
  // ARMM - Autonomous Region in Muslim Mindanao
  { code: 'BAS', name: 'Basilan', region: 'ARMM' },
  { code: 'LAS', name: 'Lanao del Sur', region: 'ARMM' },
  { code: 'MAG', name: 'Maguindanao', region: 'ARMM' },
  { code: 'SLU', name: 'Sulu', region: 'ARMM' },
  { code: 'TAW', name: 'Tawi-Tawi', region: 'ARMM' },
  
  // CAR - Cordillera Administrative Region
  { code: 'ABR', name: 'Abra', region: 'CAR' },
  { code: 'BEN', name: 'Benguet', region: 'CAR' },
  { code: 'IFU', name: 'Ifugao', region: 'CAR' },
  { code: 'KAL', name: 'Kalinga', region: 'CAR' },
  { code: 'MOU', name: 'Mountain Province', region: 'CAR' },
  { code: 'APA', name: 'Apayao', region: 'CAR' }
];

export const PHILIPPINE_CITIES_MUNICIPALITIES = [
  // Metro Manila (NCR)
  { name: 'Caloocan City', province: 'Metro Manila', region: 'NCR' },
  { name: 'Las Piñas City', province: 'Metro Manila', region: 'NCR' },
  { name: 'Makati City', province: 'Metro Manila', region: 'NCR' },
  { name: 'Malabon City', province: 'Metro Manila', region: 'NCR' },
  { name: 'Mandaluyong City', province: 'Metro Manila', region: 'NCR' },
  { name: 'Manila City', province: 'Metro Manila', region: 'NCR' },
  { name: 'Marikina City', province: 'Metro Manila', region: 'NCR' },
  { name: 'Muntinlupa City', province: 'Metro Manila', region: 'NCR' },
  { name: 'Navotas City', province: 'Metro Manila', region: 'NCR' },
  { name: 'Parañaque City', province: 'Metro Manila', region: 'NCR' },
  { name: 'Pasay City', province: 'Metro Manila', region: 'NCR' },
  { name: 'Pasig City', province: 'Metro Manila', region: 'NCR' },
  { name: 'Pateros', province: 'Metro Manila', region: 'NCR' },
  { name: 'Quezon City', province: 'Metro Manila', region: 'NCR' },
  { name: 'San Juan City', province: 'Metro Manila', region: 'NCR' },
  { name: 'Taguig City', province: 'Metro Manila', region: 'NCR' },
  { name: 'Valenzuela City', province: 'Metro Manila', region: 'NCR' },

  // Cebu Province
  { name: 'Alcantara', province: 'Cebu', region: 'Region VII' },
  { name: 'Alcoy', province: 'Cebu', region: 'Region VII' },
  { name: 'Alegria', province: 'Cebu', region: 'Region VII' },
  { name: 'Aloguinsan', province: 'Cebu', region: 'Region VII' },
  { name: 'Argao', province: 'Cebu', region: 'Region VII' },
  { name: 'Asturias', province: 'Cebu', region: 'Region VII' },
  { name: 'Badian', province: 'Cebu', region: 'Region VII' },
  { name: 'Balamban', province: 'Cebu', region: 'Region VII' },
  { name: 'Bantayan', province: 'Cebu', region: 'Region VII' },
  { name: 'Barili', province: 'Cebu', region: 'Region VII' },
  { name: 'Boljoon', province: 'Cebu', region: 'Region VII' },
  { name: 'Borbon', province: 'Cebu', region: 'Region VII' },
  { name: 'Carcar City', province: 'Cebu', region: 'Region VII' },
  { name: 'Carmen', province: 'Cebu', region: 'Region VII' },
  { name: 'Catmon', province: 'Cebu', region: 'Region VII' },
  { name: 'Cebu City', province: 'Cebu', region: 'Region VII' },
  { name: 'Compostela', province: 'Cebu', region: 'Region VII' },
  { name: 'Consolacion', province: 'Cebu', region: 'Region VII' },
  { name: 'Cordova', province: 'Cebu', region: 'Region VII' },
  { name: 'Daanbantayan', province: 'Cebu', region: 'Region VII' },
  { name: 'Dalaguete', province: 'Cebu', region: 'Region VII' },
  { name: 'Danao City', province: 'Cebu', region: 'Region VII' },
  { name: 'Dumanjug', province: 'Cebu', region: 'Region VII' },
  { name: 'Ginatilan', province: 'Cebu', region: 'Region VII' },
  { name: 'Lapu-Lapu City', province: 'Cebu', region: 'Region VII' },
  { name: 'Liloan', province: 'Cebu', region: 'Region VII' },
  { name: 'Madridejos', province: 'Cebu', region: 'Region VII' },
  { name: 'Malabuyoc', province: 'Cebu', region: 'Region VII' },
  { name: 'Mandaue City', province: 'Cebu', region: 'Region VII' },
  { name: 'Medellin', province: 'Cebu', region: 'Region VII' },
  { name: 'Minglanilla', province: 'Cebu', region: 'Region VII' },
  { name: 'Moalboal', province: 'Cebu', region: 'Region VII' },
  { name: 'Naga City', province: 'Cebu', region: 'Region VII' },
  { name: 'Oslob', province: 'Cebu', region: 'Region VII' },
  { name: 'Pilar', province: 'Cebu', region: 'Region VII' },
  { name: 'Pinamungajan', province: 'Cebu', region: 'Region VII' },
  { name: 'Poro', province: 'Cebu', region: 'Region VII' },
  { name: 'Ronda', province: 'Cebu', region: 'Region VII' },
  { name: 'Samboan', province: 'Cebu', region: 'Region VII' },
  { name: 'San Fernando', province: 'Cebu', region: 'Region VII' },
  { name: 'San Francisco', province: 'Cebu', region: 'Region VII' },
  { name: 'San Remigio', province: 'Cebu', region: 'Region VII' },
  { name: 'Santa Fe', province: 'Cebu', region: 'Region VII' },
  { name: 'Santander', province: 'Cebu', region: 'Region VII' },
  { name: 'Sibonga', province: 'Cebu', region: 'Region VII' },
  { name: 'Sogod', province: 'Cebu', region: 'Region VII' },
  { name: 'Tabogon', province: 'Cebu', region: 'Region VII' },
  { name: 'Tabuelan', province: 'Cebu', region: 'Region VII' },
  { name: 'Talisay City', province: 'Cebu', region: 'Region VII' },
  { name: 'Toledo City', province: 'Cebu', region: 'Region VII' },
  { name: 'Tuburan', province: 'Cebu', region: 'Region VII' },
  { name: 'Tudela', province: 'Cebu', region: 'Region VII' },

  // Davao del Sur
  { name: 'Bansalan', province: 'Davao del Sur', region: 'Region XI' },
  { name: 'Davao City', province: 'Davao del Sur', region: 'Region XI' },
  { name: 'Digos City', province: 'Davao del Sur', region: 'Region XI' },
  { name: 'Hagonoy', province: 'Davao del Sur', region: 'Region XI' },
  { name: 'Kiblawan', province: 'Davao del Sur', region: 'Region XI' },
  { name: 'Magsaysay', province: 'Davao del Sur', region: 'Region XI' },
  { name: 'Malalag', province: 'Davao del Sur', region: 'Region XI' },
  { name: 'Matanao', province: 'Davao del Sur', region: 'Region XI' },
  { name: 'Padada', province: 'Davao del Sur', region: 'Region XI' },
  { name: 'Santa Cruz', province: 'Davao del Sur', region: 'Region XI' },
  { name: 'Sulop', province: 'Davao del Sur', region: 'Region XI' },

  // Laguna Province
  { name: 'Alaminos', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Bay', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Biñan City', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Cabuyao City', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Calamba City', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Calauan', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Cavinti', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Famy', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Kalayaan', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Liliw', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Los Baños', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Luisiana', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Lumban', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Mabitac', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Magdalena', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Majayjay', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Nagcarlan', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Paete', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Pagsanjan', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Pakil', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Pangil', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Pila', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Rizal', province: 'Laguna', region: 'Region IV-A' },
  { name: 'San Pablo City', province: 'Laguna', region: 'Region IV-A' },
  { name: 'San Pedro City', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Santa Cruz', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Santa Maria', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Santa Rosa City', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Siniloan', province: 'Laguna', region: 'Region IV-A' },
  { name: 'Victoria', province: 'Laguna', region: 'Region IV-A' },

  // Cavite Province
  { name: 'Alfonso', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Amadeo', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Bacoor City', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Carmona', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Cavite City', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Dasmariñas City', province: 'Cavite', region: 'Region IV-A' },
  { name: 'General Mariano Alvarez', province: 'Cavite', region: 'Region IV-A' },
  { name: 'General Trias City', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Imus City', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Indang', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Kawit', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Magallanes', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Maragondon', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Mendez', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Naic', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Noveleta', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Rosario', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Silang', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Tagaytay City', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Tanza', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Ternate', province: 'Cavite', region: 'Region IV-A' },
  { name: 'Trece Martires City', province: 'Cavite', region: 'Region IV-A' },

  // Rizal Province
  { name: 'Angono', province: 'Rizal', region: 'Region IV-A' },
  { name: 'Antipolo City', province: 'Rizal', region: 'Region IV-A' },
  { name: 'Baras', province: 'Rizal', region: 'Region IV-A' },
  { name: 'Binangonan', province: 'Rizal', region: 'Region IV-A' },
  { name: 'Cainta', province: 'Rizal', region: 'Region IV-A' },
  { name: 'Cardona', province: 'Rizal', region: 'Region IV-A' },
  { name: 'Jalajala', province: 'Rizal', region: 'Region IV-A' },
  { name: 'Morong', province: 'Rizal', region: 'Region IV-A' },
  { name: 'Pililla', province: 'Rizal', region: 'Region IV-A' },
  { name: 'Rodriguez', province: 'Rizal', region: 'Region IV-A' },
  { name: 'San Mateo', province: 'Rizal', region: 'Region IV-A' },
  { name: 'Tanay', province: 'Rizal', region: 'Region IV-A' },
  { name: 'Taytay', province: 'Rizal', region: 'Region IV-A' },
  { name: 'Teresa', province: 'Rizal', region: 'Region IV-A' },

  // Batangas Province
  { name: 'Agoncillo', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Alitagtag', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Balayan', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Balete', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Batangas City', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Bauan', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Calaca', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Calatagan', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Cuenca', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Ibaan', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Laurel', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Lemery', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Lian', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Lipa City', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Lobo', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Mabini', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Malvar', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Mataasnakahoy', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Nasugbu', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Padre Garcia', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Rosario', province: 'Batangas', region: 'Region IV-A' },
  { name: 'San Jose', province: 'Batangas', region: 'Region IV-A' },
  { name: 'San Juan', province: 'Batangas', region: 'Region IV-A' },
  { name: 'San Luis', province: 'Batangas', region: 'Region IV-A' },
  { name: 'San Nicolas', province: 'Batangas', region: 'Region IV-A' },
  { name: 'San Pascual', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Santa Teresita', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Santo Tomas', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Taal', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Talisay', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Tanauan City', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Taysan', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Tingloy', province: 'Batangas', region: 'Region IV-A' },
  { name: 'Tuy', province: 'Batangas', region: 'Region IV-A' },

  // Quezon Province
  { name: 'Agdangan', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Alabat', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Atimonan', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Buenavista', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Burdeos', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Calauag', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Candelaria', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Catanauan', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Dolores', province: 'Quezon', region: 'Region IV-A' },
  { name: 'General Luna', province: 'Quezon', region: 'Region IV-A' },
  { name: 'General Nakar', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Guinayangan', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Gumaca', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Infanta', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Jomalig', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Lopez', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Lucban', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Lucena City', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Macalelon', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Mauban', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Mulanay', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Padre Burgos', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Pagbilao', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Panukulan', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Patnanungan', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Perez', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Pitogo', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Plaridel', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Polillo', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Quezon', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Real', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Sampaloc', province: 'Quezon', region: 'Region IV-A' },
  { name: 'San Andres', province: 'Quezon', region: 'Region IV-A' },
  { name: 'San Antonio', province: 'Quezon', region: 'Region IV-A' },
  { name: 'San Francisco', province: 'Quezon', region: 'Region IV-A' },
  { name: 'San Narciso', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Sariaya', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Tagkawayan', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Tayabas City', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Tiaong', province: 'Quezon', region: 'Region IV-A' },
  { name: 'Unisan', province: 'Quezon', region: 'Region IV-A' },

  // Additional major cities from other provinces
  { name: 'Iloilo City', province: 'Iloilo', region: 'Region VI' },
  { name: 'Bacolod City', province: 'Negros Occidental', region: 'Region VI' },
  { name: 'Cagayan de Oro City', province: 'Misamis Oriental', region: 'Region X' },
  { name: 'Zamboanga City', province: 'Zamboanga del Sur', region: 'Region IX' },
  { name: 'General Santos City', province: 'South Cotabato', region: 'Region XII' },
  { name: 'Butuan City', province: 'Agusan del Norte', region: 'Region XIII' },
  { name: 'Cotabato City', province: 'Maguindanao', region: 'ARMM' },
  { name: 'Dipolog City', province: 'Zamboanga del Norte', region: 'Region IX' },
  { name: 'Pagadian City', province: 'Zamboanga del Sur', region: 'Region IX' },
  { name: 'Tacloban City', province: 'Leyte', region: 'Region VIII' },
  { name: 'Calbayog City', province: 'Western Samar', region: 'Region VIII' },
  { name: 'Ormoc City', province: 'Leyte', region: 'Region VIII' },
  { name: 'Baybay City', province: 'Leyte', region: 'Region VIII' },
  { name: 'Maasin City', province: 'Southern Leyte', region: 'Region VIII' },
  { name: 'Catbalogan City', province: 'Western Samar', region: 'Region VIII' },
  { name: 'Borongan City', province: 'Eastern Samar', region: 'Region VIII' },
  { name: 'Calapan City', province: 'Mindoro Oriental', region: 'Region IV-B' },
  { name: 'San Jose City', province: 'Nueva Ecija', region: 'Region III' },
  { name: 'Baguio City', province: 'Benguet', region: 'CAR' },
  { name: 'Dagupan City', province: 'Pangasinan', region: 'Region I' },
  { name: 'San Fernando City', province: 'La Union', region: 'Region I' },
  { name: 'Vigan City', province: 'Ilocos Sur', region: 'Region I' },
  { name: 'Laoag City', province: 'Ilocos Norte', region: 'Region I' },
  { name: 'Tuguegarao City', province: 'Cagayan', region: 'Region II' },
  { name: 'Isabela City', province: 'Basilan', region: 'ARMM' },
  { name: 'San Fernando City', province: 'Pampanga', region: 'Region III' },
  { name: 'Malolos City', province: 'Bulacan', region: 'Region III' },
  { name: 'Balanga City', province: 'Bataan', region: 'Region III' },
  { name: 'Palayan City', province: 'Nueva Ecija', region: 'Region III' },
  { name: 'Tarlac City', province: 'Tarlac', region: 'Region III' },
  { name: 'Olongapo City', province: 'Zambales', region: 'Region III' },
  { name: 'Legazpi City', province: 'Albay', region: 'Region V' },
  { name: 'Naga City', province: 'Camarines Sur', region: 'Region V' },
  { name: 'Daet', province: 'Camarines Norte', region: 'Region V' },
  { name: 'Virac', province: 'Catanduanes', region: 'Region V' },
  { name: 'Masbate City', province: 'Masbate', region: 'Region V' },
  { name: 'Sorsogon City', province: 'Sorsogon', region: 'Region V' },
  { name: 'Kalibo', province: 'Aklan', region: 'Region VI' },
  { name: 'San Jose de Buenavista', province: 'Antique', region: 'Region VI' },
  { name: 'Roxas City', province: 'Capiz', region: 'Region VI' },
  { name: 'Jordan', province: 'Guimaras', region: 'Region VI' },
  { name: 'Tagbilaran City', province: 'Bohol', region: 'Region VII' },
  { name: 'Dumaguete City', province: 'Negros Oriental', region: 'Region VII' },
  { name: 'Siquijor', province: 'Siquijor', region: 'Region VII' },
  { name: 'Naval', province: 'Biliran', region: 'Region VIII' },
  { name: 'Borongan City', province: 'Eastern Samar', region: 'Region VIII' },
  { name: 'Catarman', province: 'Northern Samar', region: 'Region VIII' },
  { name: 'Maasin City', province: 'Southern Leyte', region: 'Region VIII' },
  { name: 'Dipolog City', province: 'Zamboanga del Norte', region: 'Region IX' },
  { name: 'Pagadian City', province: 'Zamboanga del Sur', region: 'Region IX' },
  { name: 'Ipil', province: 'Zamboanga Sibugay', region: 'Region IX' },
  { name: 'Malaybalay City', province: 'Bukidnon', region: 'Region X' },
  { name: 'Mambajao', province: 'Camiguin', region: 'Region X' },
  { name: 'Iligan City', province: 'Lanao del Norte', region: 'Region X' },
  { name: 'Oroquieta City', province: 'Misamis Occidental', region: 'Region X' },
  { name: 'Gingoog City', province: 'Misamis Oriental', region: 'Region X' },
  { name: 'Nabunturan', province: 'Compostela Valley', region: 'Region XI' },
  { name: 'Tagum City', province: 'Davao del Norte', region: 'Region XI' },
  { name: 'Digos City', province: 'Davao del Sur', region: 'Region XI' },
  { name: 'Malita', province: 'Davao Occidental', region: 'Region XI' },
  { name: 'Mati City', province: 'Davao Oriental', region: 'Region XI' },
  { name: 'Kidapawan City', province: 'North Cotabato', region: 'Region XII' },
  { name: 'Alabel', province: 'Sarangani', region: 'Region XII' },
  { name: 'Koronadal City', province: 'South Cotabato', region: 'Region XII' },
  { name: 'Isulan', province: 'Sultan Kudarat', region: 'Region XII' },
  { name: 'Cabadbaran City', province: 'Agusan del Norte', region: 'Region XIII' },
  { name: 'Prosperidad', province: 'Agusan del Sur', region: 'Region XIII' },
  { name: 'San Jose', province: 'Dinagat Islands', region: 'Region XIII' },
  { name: 'Surigao City', province: 'Surigao del Norte', region: 'Region XIII' },
  { name: 'Tandag City', province: 'Surigao del Sur', region: 'Region XIII' },
  { name: 'Isabela City', province: 'Basilan', region: 'ARMM' },
  { name: 'Marawi City', province: 'Lanao del Sur', region: 'ARMM' },
  { name: 'Shariff Aguak', province: 'Maguindanao', region: 'ARMM' },
  { name: 'Jolo', province: 'Sulu', region: 'ARMM' },
  { name: 'Bongao', province: 'Tawi-Tawi', region: 'ARMM' },
  { name: 'Bangued', province: 'Abra', region: 'CAR' },
  { name: 'La Trinidad', province: 'Benguet', region: 'CAR' },
  { name: 'Lagawe', province: 'Ifugao', region: 'CAR' },
  { name: 'Tabuk City', province: 'Kalinga', region: 'CAR' },
  { name: 'Bontoc', province: 'Mountain Province', region: 'CAR' },
  { name: 'Kabugao', province: 'Apayao', region: 'CAR' }
];

// Helper functions
export const getProvincesByRegion = (region) => {
  return PHILIPPINE_PROVINCES.filter(province => province.region === region);
};

export const getCitiesByProvince = (province) => {
  return PHILIPPINE_CITIES_MUNICIPALITIES.filter(city => city.province === province);
};

export const getCitiesByRegion = (region) => {
  return PHILIPPINE_CITIES_MUNICIPALITIES.filter(city => city.region === region);
};

export const getAllRegions = () => {
  return [...new Set(PHILIPPINE_PROVINCES.map(province => province.region))];
};

export const searchCities = (query) => {
  if (!query) return PHILIPPINE_CITIES_MUNICIPALITIES;
  
  const lowercaseQuery = query.toLowerCase();
  return PHILIPPINE_CITIES_MUNICIPALITIES.filter(city => 
    city.name.toLowerCase().includes(lowercaseQuery) ||
    city.province.toLowerCase().includes(lowercaseQuery) ||
    city.region.toLowerCase().includes(lowercaseQuery)
  );
};

export const searchProvinces = (query) => {
  if (!query) return PHILIPPINE_PROVINCES;
  
  const lowercaseQuery = query.toLowerCase();
  return PHILIPPINE_PROVINCES.filter(province => 
    province.name.toLowerCase().includes(lowercaseQuery) ||
    province.region.toLowerCase().includes(lowercaseQuery)
  );
};
