declare module 'propertiesmanager' {
    /**
     * Configuration object loaded from config/default.json
     * Contains all properties for the current environment (production/dev/test)
     */
    export const conf: Record<string, any>;
}
