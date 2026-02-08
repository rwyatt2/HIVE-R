/**
 * Plugins Page
 * 
 * Plugin management with marketplace and builder views.
 */

import { useState } from 'react';
import { Marketplace } from '../components/PluginMarketplace/Marketplace';
import { PluginBuilder } from '../components/PluginBuilder/PluginBuilder';

type View = 'marketplace' | 'builder' | null;

export function PluginsPage() {
    const [view, setView] = useState<View>('marketplace');

    const handleClose = () => {
        setView(null);
        // Navigate back or show main content
    };

    const handleOpenBuilder = () => {
        setView('builder');
    };

    const handleOpenMarketplace = () => {
        setView('marketplace');
    };

    const handleSavePlugin = (plugin: unknown) => {
        console.log('Plugin saved:', plugin);
        setView('marketplace');
    };

    if (view === 'builder') {
        return (
            <PluginBuilder
                onClose={handleOpenMarketplace}
                onSave={handleSavePlugin}
            />
        );
    }

    return (
        <Marketplace
            onClose={handleClose}
            onOpenBuilder={handleOpenBuilder}
            accessToken={null}
        />
    );
}

export default PluginsPage;
