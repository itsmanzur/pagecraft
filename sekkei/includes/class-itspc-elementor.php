<?php
/**
 * Elementor editor integration.
 *
 * @package Sekkei
 */

if ( ! defined( 'ABSPATH' ) ) {
    die();
}

/**
 * Class ITSPC_Elementor
 *
 * Injects the Sekkei floating button and sliding panel into the Elementor editor.
 * Uses the free Elementor hooks - no Pro API required.
 */
class ITSPC_Elementor {

    /**
     * Cached settings array.
     *
     * @var array|null
     */
    private $settings = null;

    /**
     * Constructor - register Elementor editor hooks.
     */
    public function __construct() {
        add_action( 'elementor/editor/after_enqueue_scripts', array( $this, 'enqueue_editor_scripts' ) );
        add_action( 'elementor/editor/after_enqueue_styles', array( $this, 'enqueue_editor_styles' ) );
        add_action( 'elementor/editor/footer', array( $this, 'render_editor_panel' ) );

        add_action( 'admin_init', function() {
            if ( defined( 'ELEMENTOR_VERSION' ) && version_compare( ELEMENTOR_VERSION, '3.0.0', '<' ) ) {
                add_action( 'admin_notices', function() {
                    echo '<div class="notice notice-warning is-dismissible"><p>' .
                         esc_html__( 'Sekkei requires Elementor 3.0.0 or higher. Please update Elementor.', 'sekkei' ) .
                         '</p></div>';
                } );
            }
        } );
    }

    /**
     * Get plugin settings (cached).
     *
     * @return array
     */
    private function get_settings() {
        if ( null === $this->settings ) {
            $this->settings = get_option( 'itspc_settings', array() );
        }
        return $this->settings;
    }

    /**
     * Get asset version string - filemtime in debug mode, plugin version in production.
     *
     * @param string $relative_path Relative path from plugin dir.
     * @return string|int
     */
    private function get_asset_version( $relative_path ) {
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
            return filemtime( ITSPC_PLUGIN_DIR . $relative_path );
        }
        return ITSPC_VERSION;
    }

    /**
     * Enqueue JavaScript for the Elementor editor.
     */
    public function enqueue_editor_scripts() {
        $settings = $this->get_settings();

        // Check if tool should show in editor
        $show = isset( $settings['show_in_editor'] ) ? $settings['show_in_editor'] : true;
        if ( ! $show ) {
            return;
        }

        $debug = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;
        $suffix = $debug ? '' : '.min';

        wp_enqueue_script(
            'itspc-editor',
            ITSPC_PLUGIN_URI . '/assets/js/itspc-editor' . $suffix . '.js',
            array(),
            $this->get_asset_version( 'assets/js/itspc-editor' . $suffix . '.js' ),
            true
        );

        $display_settings = array(
            'plannerShowHealth' => isset( $settings['planner_show_health'] ) ? (bool) $settings['planner_show_health'] : true,
            'plannerShowNotes'  => isset( $settings['planner_show_notes'] ) ? (bool) $settings['planner_show_notes'] : true,
            'plannerShowCss'    => isset( $settings['planner_show_css'] ) ? (bool) $settings['planner_show_css'] : true,
            'plannerShowBadges' => isset( $settings['planner_show_badges'] ) ? (bool) $settings['planner_show_badges'] : true,
        );

        $tool_args = array(
            'v'       => ITSPC_VERSION,
            'display' => rawurlencode( wp_json_encode( $display_settings ) ),
        );

        if ( $debug ) {
            $tool_args['debug'] = '1';
        }

        wp_localize_script( 'itspc-editor', 'itspcData', array(
            'ajaxUrl'       => admin_url( 'admin-ajax.php' ),
            'ajaxNonce'     => wp_create_nonce( 'itspc-ajax-nonce' ),
            'toolUrl'       => add_query_arg(
                $tool_args,
                ITSPC_PLUGIN_URI . '/assets/tool/index.html'
            ),
            'assetBaseUrl'  => ITSPC_PLUGIN_URI . '/assets',
            'panelPosition' => isset( $settings['panel_position'] ) ? $settings['panel_position'] : 'right',
            'panelWidth'    => isset( $settings['panel_width'] ) ? absint( $settings['panel_width'] ) : 420,
            'pluginVersion' => ITSPC_VERSION,
            'display'       => $display_settings,
        ) );
    }

    /**
     * Enqueue CSS for the Elementor editor.
     */
    public function enqueue_editor_styles() {
        $settings = $this->get_settings();
        $show     = isset( $settings['show_in_editor'] ) ? $settings['show_in_editor'] : true;

        if ( ! $show ) {
            return;
        }

        $suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

        wp_enqueue_style(
            'itspc-editor-css',
            ITSPC_PLUGIN_URI . '/assets/css/itspc-editor' . $suffix . '.css',
            array(),
            $this->get_asset_version( 'assets/css/itspc-editor' . $suffix . '.css' )
        );
    }

    /**
     * Render the floating button and panel HTML in the Elementor editor footer.
     */
    public function render_editor_panel() {
        $settings = $this->get_settings();
        $show     = isset( $settings['show_in_editor'] ) ? $settings['show_in_editor'] : true;

        if ( ! $show ) {
            return;
        }

        $position = isset( $settings['panel_position'] ) ? $settings['panel_position'] : 'right';
        $width    = isset( $settings['panel_width'] ) ? absint( $settings['panel_width'] ) : 420;
        ?>
        <!-- Sekkei Toggle Button -->
        <div id="itspc-toggle-btn" title="<?php esc_attr_e( 'Sekkei (Ctrl+Shift+P)', 'sekkei' ); ?>">
            <span class="itspc-btn-text">Sekkei</span>
        </div>

        <!-- Sekkei Sliding Panel -->
        <div id="itspc-panel" class="itspc-panel-closed itspc-pos-<?php echo esc_attr( $position ); ?>" style="width:<?php echo esc_attr( $width ); ?>px;">
            <div id="itspc-panel-resizer"></div>
            <div class="itspc-panel-header">
                <span class="itspc-panel-title">Sek<span>kei</span></span>
                <button id="itspc-panel-popout" class="itspc-panel-btn" aria-label="<?php esc_attr_e( 'Open in new window', 'sekkei' ); ?>">
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M7 17L17 7"></path><path d="M8 7h9v9"></path>
                    </svg>
                </button>
                <button id="itspc-panel-close" class="itspc-panel-btn" aria-label="<?php esc_attr_e( 'Close', 'sekkei' ); ?>">
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M18 6L6 18"></path><path d="M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <iframe id="itspc-panel-iframe" src="" loading="lazy" title="<?php esc_attr_e( 'Sekkei Tool', 'sekkei' ); ?>"></iframe>
        </div>
        <?php
    }
}
