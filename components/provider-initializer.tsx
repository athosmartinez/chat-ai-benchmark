"use client";

import { getModels } from "../app/(models)/actions";
import { createDynamicProvider } from "../lib/ai/models";
import { useEffect } from "react";

// This is a hidden component that initializes the provider
export function ProviderInitializer() {
  useEffect(() => {
    const initializeProvider = async () => {
      try {
        const models = await getModels();
        if (models.length > 0) {
          // Create a new provider with the models from the database
          const dynamicProvider = createDynamicProvider(models);

          // Make it available globally
          window.aiProvider = dynamicProvider;
        }
      } catch (error) {
        console.error("Failed to initialize AI provider:", error);
      }
    };

    initializeProvider();
  }, []);

  // This component doesn't render anything
  return null;
}
