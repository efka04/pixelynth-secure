const functions = require('firebase-functions-test')();
const admin = require('firebase-admin');
const sinon = require('sinon');
const assert = require('assert');

// Importer les fonctions à tester
const myFunctions = require('../src/imageSync');

describe('Image Synchronization Tests', () => {
  let adminStub;
  
  beforeEach(() => {
    // Stub minimal pour admin.firestore
    adminStub = sinon.stub(admin, 'firestore').returns({
      collection: () => ({
        get: () => Promise.resolve({ empty: true, docs: [] })
      }),
      doc: () => ({
        get: () => Promise.resolve({ exists: false })
      }),
      batch: () => ({
        update: () => {},
        commit: () => Promise.resolve()
      }),
      FieldValue: {
        serverTimestamp: () => 'timestamp',
        arrayRemove: () => 'arrayRemove',
        increment: () => 'increment'
      }
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should run syncImageUpdate without errors', () => {
    const wrapped = functions.wrap(myFunctions.syncImageUpdate);
    
    return wrapped({
      before: { data: () => ({ title: 'Old' }) },
      after: { data: () => ({ title: 'New' }) }
    }, { params: { imageId: 'test123' } });
  });
  
  it('should run syncImageDelete without errors', () => {
    const wrapped = functions.wrap(myFunctions.syncImageDelete);
    
    return wrapped({
      data: () => ({ title: 'Test' })
    }, { params: { imageId: 'test123' } });
  });
});
