<?php
/**
 * @package   Sekkei
 * @author    itsmanzur
 * @license   GPL-2.0+
 * @link      https://profiles.wordpress.org/itsmanzur/
 * @copyright 2026 itsmanzur
 *
 * @wordpress-plugin
 * Plugin Name:       Sekkei - Section Planner & Workflow Toolkit for Elementor
 * Plugin URI:        https://wordpress.org/plugins/sekkei/
 * Description:       A workflow tool for Elementor - section planner, design checklist, color palette, font pairing, CSS generator, and project notes.
 * Version:           1.5.0
 * Author:            itsmanzur
 * Author URI:        https://profiles.wordpress.org/itsmanzur/
 * Text Domain:       sekkei
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Requires at least: 5.8
 * Requires PHP:      7.4
 */

// Protect direct access
if ( ! defined( 'ABSPATH' ) ) {
    die();
}

/**
 * Plugin constants
 */
if ( ! defined( 'ITSPC_VERSION' ) ) {
    define( 'ITSPC_VERSION', '1.5.0' );
}
if ( ! defined( 'ITSPC_PLUGIN_DIR' ) ) {
    define( 'ITSPC_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
}
if ( ! defined( 'ITSPC_PLUGIN_URI' ) ) {
    define( 'ITSPC_PLUGIN_URI', plugins_url( '', __FILE__ ) );
}
if ( ! defined( 'ITSPC_BASE_NAME' ) ) {
    define( 'ITSPC_BASE_NAME', plugin_basename( __FILE__ ) );
}
if ( ! defined( 'ITSPC_PLUGIN_FILE' ) ) {
    define( 'ITSPC_PLUGIN_FILE', __FILE__ );
}

require_once ITSPC_PLUGIN_DIR . 'includes/class-itspc-core.php';

/**
 * Plugin activation hook.
 */
register_activation_hook( __FILE__, 'itspc_activate' );

function itspc_activate() {
    if ( get_option( 'itspc_settings' ) === false ) {
        update_option( 'itspc_settings', array(
            'show_in_editor'  => true,
            'panel_position'  => 'right',
            'panel_width'     => 420,
            'show_admin_page' => true,
        ) );
    }
    if ( get_option( 'itspc_plugin_version' ) === false ) {
        update_option( 'itspc_plugin_version', ITSPC_VERSION );
    }
}

/**
 * Plugin deactivation hook.
 */
register_deactivation_hook( __FILE__, 'itspc_deactivate' );

function itspc_deactivate() {
    flush_rewrite_rules();
}

/**
 * Initialize the plugin.
 *
 * @return ITSPC_Core
 */
function itspc_init() {
    return ITSPC_Core::get_instance();
}

itspc_init();
