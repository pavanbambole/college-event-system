/**
 * CampusConnect JSON Database Engine
 * 
 * Provides safe, asynchronous file-based CRUD operations with JSON serialization.
 * Implements atomic writes and error resilience suitable for TAE-I college project.
 */

const fs = require('fs').promises;
const path = require('path');

// Base directory for all JSON database files
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

/**
 * Ensures the data directory exists
 */
const ensureDataDir = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error ensuring data directory exists:', err);
  }
};

/**
 * Get the full path to a JSON file
 * @param {string} fileName - e.g., 'students.json' or 'students'
 */
const getFilePath = (fileName) => {
  const cleanName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  return path.join(DATA_DIR, cleanName);
};

/**
 * Read data from a JSON file safely
 * @param {string} fileName 
 * @returns {Promise<Array>} Array of records
 */
const readData = async (fileName) => {
  await ensureDataDir();
  const filePath = getFilePath(fileName);
  try {
    const rawData = await fs.readFile(filePath, 'utf-8');
    if (!rawData || rawData.trim() === '') {
      return [];
    }
    return JSON.parse(rawData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, initialize as empty array
      await writeData(fileName, []);
      return [];
    }
    console.error(`Error reading ${fileName}:`, error);
    throw new Error(`Failed to read database file: ${fileName}`);
  }
};

/**
 * Write data to a JSON file atomically
 * @param {string} fileName 
 * @param {Array|Object} data 
 */
const writeData = async (fileName, data) => {
  await ensureDataDir();
  const filePath = getFilePath(fileName);
  const tempPath = `${filePath}.tmp`;

  try {
    const jsonString = JSON.stringify(data, null, 2);
    // Write to temporary file first for atomic write safety
    await fs.writeFile(tempPath, jsonString, 'utf-8');
    await fs.rename(tempPath, filePath);
    return true;
  } catch (error) {
    console.error(`Error writing to ${fileName}:`, error);
    // Clean up temp file if exists
    try {
      await fs.unlink(tempPath);
    } catch (_) {}
    throw new Error(`Failed to write database file: ${fileName}`);
  }
};

/**
 * Find a single record by its 'id' field
 * @param {string} fileName 
 * @param {string} id 
 */
const findById = async (fileName, id) => {
  const records = await readData(fileName);
  return records.find(item => item.id === id || item._id === id) || null;
};

/**
 * Find a single record by case-insensitive 'email'
 * @param {string} fileName 
 * @param {string} email 
 */
const findByEmail = async (fileName, email) => {
  if (!email) return null;
  const records = await readData(fileName);
  const cleanEmail = email.trim().toLowerCase();
  return records.find(item => item.email && item.email.trim().toLowerCase() === cleanEmail) || null;
};

/**
 * Generate a unique ID with an optional prefix
 * @param {string} prefix - e.g., 'STU', 'EVT', 'REG', 'FDB'
 */
const generateId = (prefix = 'REC') => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}${timestamp}${randomNum}`.slice(0, 10);
};

/**
 * Create and insert a new record
 * @param {string} fileName 
 * @param {Object} newRecord 
 */
const createRecord = async (fileName, newRecord) => {
  const records = await readData(fileName);
  
  if (!newRecord.id) {
    const prefixMap = {
      'students': 'STU',
      'events': 'EVT',
      'registrations': 'REG',
      'feedback': 'FDB',
      'admins': 'ADM'
    };
    const prefix = prefixMap[fileName.replace('.json', '')] || 'REC';
    newRecord.id = generateId(prefix);
  }

  const now = new Date().toISOString();
  newRecord.createdAt = newRecord.createdAt || now;
  newRecord.updatedAt = now;

  records.push(newRecord);
  await writeData(fileName, records);
  return newRecord;
};

/**
 * Update an existing record by ID
 * @param {string} fileName 
 * @param {string} id 
 * @param {Object} updatedFields 
 */
const updateRecord = async (fileName, id, updatedFields) => {
  const records = await readData(fileName);
  const index = records.findIndex(item => item.id === id || item._id === id);

  if (index === -1) {
    return null;
  }

  const existingRecord = records[index];
  const updatedRecord = {
    ...existingRecord,
    ...updatedFields,
    id: existingRecord.id, // Immutable ID
    updatedAt: new Date().toISOString()
  };

  records[index] = updatedRecord;
  await writeData(fileName, records);
  return updatedRecord;
};

/**
 * Delete a record by ID
 * @param {string} fileName 
 * @param {string} id 
 */
const deleteRecord = async (fileName, id) => {
  const records = await readData(fileName);
  const initialLength = records.length;
  const filtered = records.filter(item => item.id !== id && item._id !== id);

  if (filtered.length === initialLength) {
    return false; // Nothing deleted
  }

  await writeData(fileName, filtered);
  return true;
};

module.exports = {
  readData,
  writeData,
  findById,
  findByEmail,
  createRecord,
  updateRecord,
  deleteRecord,
  generateId
};
