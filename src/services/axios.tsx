import axios from "axios";

export const Axios = axios.create({
  timeout: 20000,
});

export const AxiosLongTimeOut = axios.create({
  timeout: 1200000,
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const AxiosDB = axios.create({
  baseURL: `${appUrl}/api/db/`,
  timeout: 20000,
  withCredentials: true,
});

export async function requestDB<T = any>(
  modelName: string,
  funcName: string,
  param?: any
): Promise<T> {
  try {
    console.log(`${appUrl}/api/db/${modelName}`);
    const response = await AxiosDB.post(modelName, {
      funcName,
      param,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error in requestDB:", error.response?.data || error.message);
    throw error;
  }
}

export default AxiosDB;
