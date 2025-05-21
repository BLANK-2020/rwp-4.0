import axios from 'axios';

interface BullhornConfig {
  apiKey: string;
  clientId: string;
  clientSecret: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  status: string;
  atsData?: {
    bullhornId?: string;
  };
}

interface TokenResponse {
  access_token: string;
}

interface JobResponse {
  data: {
    id: string;
  };
}

export const bullhornIntegration = {
  async syncJob(job: Job, config: BullhornConfig) {
    try {
      // Get access token
      const tokenResponse = await axios.post<TokenResponse>('https://auth.bullhornstaffing.com/oauth/token', {
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
      });

      const accessToken = tokenResponse.data.access_token;

      // Map job data to Bullhorn format
      const bullhornJob = {
        title: job.title,
        description: job.description,
        address: {
          city: job.location,
        },
        employmentType: job.type,
        salary: job.salary
          ? {
              minimum: job.salary.min,
              maximum: job.salary.max,
              currency: job.salary.currency,
            }
          : undefined,
        status: job.status === 'published' ? 'Open' : 'Draft',
      };

      // Create or update job in Bullhorn
      if (job.atsData?.bullhornId) {
        await axios.put(
          `https://rest.bullhornstaffing.com/rest-services/${config.apiKey}/entity/JobOrder/${job.atsData.bullhornId}`,
          bullhornJob,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      } else {
        const response = await axios.post<JobResponse>(
          `https://rest.bullhornstaffing.com/rest-services/${config.apiKey}/entity/JobOrder`,
          bullhornJob,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        // Update job with Bullhorn ID - use absolute URL
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        await axios.patch(`${baseUrl}/api/jobs/${job.id}`, {
          atsData: {
            bullhornId: response.data.data.id,
          },
        });
      }
    } catch (error) {
      console.error('Bullhorn sync error:', error);
      throw error;
    }
  },
}; 