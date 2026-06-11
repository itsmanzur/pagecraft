<?php
/**
 * Clean uninstall handler.
 *
 * This file runs only when the plugin is fully uninstalled (deleted),
 * NOT on deactivation. It cleans up all plugin data from the database.
 *
 * @package Sekkei
 */

// If uninstall not called from WordPress, exit
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    die();
}

// Delete all plugin options
delete_option( 'itspc_settings' );
delete_option( 'itspc_plugin_version' );
