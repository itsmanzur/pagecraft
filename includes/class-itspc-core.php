<?php
/**
 * Core plugin class — singleton orchestrator.
 *
 * @package Sekkei
 */

if ( ! defined( 'ABSPATH' ) ) {
    die();
}

/**
 * Class ITSPC_Core
 *
 * Main plugin class that initializes all components.
 */
class ITSPC_Core {

    /**
     * Singleton instance.
     *
     * @var ITSPC_Core|null
     */
    private static $instance = null;

    /**
     * Get singleton instance.
     *
     * @return ITSPC_Core
     */
    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor — load dependencies and initialize hooks.
     */
    private function __construct() {
        $this->includes();
        $this->init_admin();

        // Initialize Elementor integration when plugins are loaded
        add_action( 'plugins_loaded', array( $this, 'init_elementor' ) );

        // Plugin action links
        add_filter( 'plugin_action_links_' . ITSPC_BASE_NAME, array( $this, 'plugin_action_links' ) );
    }

    /**
     * Include required class files.
     */
    private function includes() {
        require_once ITSPC_PLUGIN_DIR . 'includes/class-itspc-admin.php';
        require_once ITSPC_PLUGIN_DIR . 'includes/class-itspc-elementor.php';
    }

    /**
     * Initialize admin functionality.
     */
    private function init_admin() {
        new ITSPC_Admin();
    }

    /**
     * Initialize Elementor integration if Elementor is active.
     */
    public function init_elementor() {
        if ( did_action( 'elementor/loaded' ) ) {
            new ITSPC_Elementor();
        }
    }

    /**
     * Add plugin action links (Settings + Open Tool).
     *
     * @param array $links Existing plugin action links.
     * @return array Modified links.
     */
    public function plugin_action_links( $links ) {
        $settings_link = sprintf(
            '<a href="%s">%s</a>',
            esc_url( admin_url( 'admin.php?page=sekkei' ) ),
            esc_html__( 'Settings', 'sekkei' )
        );
        $tool_link = sprintf(
            '<a href="%s" style="color:#A8D800;font-weight:600">%s</a>',
            esc_url( admin_url( 'admin.php?page=sekkei-tool' ) ),
            esc_html__( 'Open Tool', 'sekkei' )
        );

        array_unshift( $links, $settings_link, $tool_link );
        return $links;
    }
}
