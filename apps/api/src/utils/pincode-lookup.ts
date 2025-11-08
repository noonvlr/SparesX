// Pincode lookup utility for Indian postal codes
// Uses external API for real-time pincode data

import https from 'https';

interface PincodeData {
  pincode: string;
  state: string;
  district: string;
  city: string;
}

interface ApiResponse {
  Status: string;
  PostOffice: Array<{
    Name: string;
    Description: string;
    BranchType: string;
    DeliveryStatus: string;
    Circle: string;
    District: string;
    Division: string;
    Region: string;
    State: string;
    Country: string;
    Pincode: string;
  }>;
}

export class PincodeLookup {
  private static async makeApiCall(pincode: string): Promise<ApiResponse[]> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.postalpincode.in',
        port: 443,
        path: `/pincode/${pincode}`,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SparesX-App/1.0'
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (error) {
            reject(new Error('Failed to parse API response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  static async getLocationByPincode(pincode: string): Promise<PincodeData | null> {
    try {
      // Clean the pincode (remove spaces, ensure 6 digits)
      const cleanPincode = pincode.replace(/\s/g, '').trim();
      
      // Validate pincode format (6 digits)
      if (!/^\d{6}$/.test(cleanPincode)) {
        return null;
      }
      
      // Make API call to get pincode data
      const data = await this.makeApiCall(cleanPincode);
      
      if (!data || data.length === 0 || data[0].Status !== 'Success') {
        console.error('Pincode API returned unsuccessful response:', data);
        return null;
      }

      const postOffice = data[0].PostOffice;
      if (!postOffice || postOffice.length === 0) {
        console.error('No post office data found for pincode:', cleanPincode);
        return null;
      }

      // Use the first post office data (they should all have the same state/district)
      const firstOffice = postOffice[0];
      
      return {
        pincode: cleanPincode,
        state: firstOffice.State || 'Unknown',
        district: firstOffice.District || 'Unknown',
        city: firstOffice.Name || 'Unknown'
      };

    } catch (error) {
      console.error('Error fetching pincode data:', error);
      
      // Fallback: return a generic response for valid pincodes
      const cleanPincode = pincode.replace(/\s/g, '').trim();
      if (/^\d{6}$/.test(cleanPincode)) {
        return {
          pincode: cleanPincode,
          state: 'India',
          district: 'Unknown',
          city: 'Unknown'
        };
      }
      
      return null;
    }
  }
  
  static validatePincode(pincode: string): boolean {
    const cleanPincode = pincode.replace(/\s/g, '').trim();
    return /^\d{6}$/.test(cleanPincode);
  }

  // Cache for frequently requested pincodes to reduce API calls
  private static cache = new Map<string, PincodeData>();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly CACHE_TIMESTAMPS = new Map<string, number>();

  static async getLocationByPincodeWithCache(pincode: string): Promise<PincodeData | null> {
    const cleanPincode = pincode.replace(/\s/g, '').trim();
    
    // Check cache first
    const cached = this.cache.get(cleanPincode);
    const timestamp = this.CACHE_TIMESTAMPS.get(cleanPincode);
    
    if (cached && timestamp && (Date.now() - timestamp) < this.CACHE_DURATION) {
      console.log('Returning cached pincode data for:', cleanPincode);
      return cached;
    }

    // Fetch from API
    const result = await this.getLocationByPincode(cleanPincode);
    
    // Cache the result if successful
    if (result) {
      this.cache.set(cleanPincode, result);
      this.CACHE_TIMESTAMPS.set(cleanPincode, Date.now());
      console.log('Cached pincode data for:', cleanPincode);
    }

    return result;
  }

  // Clear cache (useful for testing or memory management)
  static clearCache(): void {
    this.cache.clear();
    this.CACHE_TIMESTAMPS.clear();
    console.log('Pincode cache cleared');
  }
}