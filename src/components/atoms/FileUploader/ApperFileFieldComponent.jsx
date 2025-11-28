import React, { useEffect, useRef, useState, useMemo } from 'react';

const ApperFileFieldComponent = ({ config, elementId }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  
  const mountedRef = useRef(false);
  const elementIdRef = useRef(elementId);
  const existingFilesRef = useRef([]);

  // Update elementId ref when it changes
  useEffect(() => {
    elementIdRef.current = elementId;
  }, [elementId]);

  // Memoize existingFiles to prevent unnecessary re-renders
  const existingFiles = useMemo(() => {
    if (!config?.existingFiles || config.existingFiles.length === 0) {
      return [];
    }
    
    // Detect actual changes by comparing length and first file's ID
    const currentFiles = config.existingFiles;
    const previousFiles = existingFilesRef.current;
    
    if (currentFiles.length !== previousFiles.length) {
      return currentFiles;
    }
    
    if (currentFiles.length > 0 && previousFiles.length > 0) {
      const currentFirstId = currentFiles[0].Id || currentFiles[0].id;
      const previousFirstId = previousFiles[0].Id || previousFiles[0].id;
      
      if (currentFirstId !== previousFirstId) {
        return currentFiles;
      }
    }
    
    return previousFiles;
  }, [config?.existingFiles]);

  // Initial mount effect
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50;
    const attemptInterval = 100;

    const initializeSDK = async () => {
      if (attempts >= maxAttempts) {
        setError('ApperSDK failed to load after 5 seconds');
        return;
      }

      if (!window.ApperSDK) {
        attempts++;
        setTimeout(initializeSDK, attemptInterval);
        return;
      }

      try {
        const { ApperFileUploader } = window.ApperSDK;
        elementIdRef.current = `file-uploader-${elementId}`;
        
        await ApperFileUploader.FileField.mount(elementIdRef.current, {
          ...config,
          existingFiles: existingFiles
        });
        
        mountedRef.current = true;
        setIsReady(true);
        existingFilesRef.current = existingFiles;
      } catch (error) {
        console.error('Error mounting file field:', error);
        setError('Failed to initialize file uploader');
      }
    };

    if (!mountedRef.current) {
      initializeSDK();
    }

    // Cleanup function
    return () => {
      if (mountedRef.current && window.ApperSDK) {
        try {
          const { ApperFileUploader } = window.ApperSDK;
          ApperFileUploader.FileField.unmount(elementIdRef.current);
        } catch (error) {
          console.error('Error unmounting file field:', error);
        }
      }
      mountedRef.current = false;
      setIsReady(false);
    };
  }, [elementId, config, existingFiles]);

  // File update effect
  useEffect(() => {
    if (!isReady || !window.ApperSDK || !config?.fieldKey) {
      return;
    }

    // Deep equality check
    const currentFilesStr = JSON.stringify(existingFiles);
    const previousFilesStr = JSON.stringify(existingFilesRef.current);
    
    if (currentFilesStr === previousFilesStr) {
      return;
    }

    try {
      const { ApperFileUploader } = window.ApperSDK;
      
      // Format detection and conversion
      let filesToUpdate = existingFiles;
      if (existingFiles.length > 0) {
        const firstFile = existingFiles[0];
        // Check if format conversion needed (API format has .Id, UI format has .id)
        if (firstFile.Id && !firstFile.id) {
          filesToUpdate = ApperFileUploader.toUIFormat(existingFiles);
        }
      }
      
      if (filesToUpdate.length > 0) {
        ApperFileUploader.FileField.updateFiles(config.fieldKey, filesToUpdate);
      } else {
        ApperFileUploader.FileField.clearField(config.fieldKey);
      }
      
      existingFilesRef.current = existingFiles;
    } catch (error) {
      console.error('Error updating files:', error);
      setError('Failed to update files');
    }
  }, [existingFiles, isReady, config?.fieldKey]);

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div id={`file-uploader-${elementId}`} className="w-full">
        {!isReady && (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-gray-600 text-sm">Loading file uploader...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApperFileFieldComponent;