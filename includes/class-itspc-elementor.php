<?php
/**
 * Elementor editor integration.
 *
 * @package PageCraft
 */

if ( ! defined( 'ABSPATH' ) ) {
    die();
}

/**
 * Class ITSPC_Elementor
 *
 * Injects the PageCraft floating button and sliding panel into the Elementor editor.
 * Uses the free Elementor hooks — no Pro API required.
 */
class ITSPC_Elementor {

    /**
     * Cached settings array.
     *
     * @var array|null
     */
    private $settings = null;

    /**
     * Constructor — register Elementor editor hooks.
     */
    public function __construct() {
        add_action( 'elementor/editor/after_enqueue_scripts', array( $this, 'enqueue_editor_scripts' ) );
        add_action( 'elementor/editor/after_enqueue_styles', array( $this, 'enqueue_editor_styles' ) );
        add_action( 'elementor/editor/footer', array( $this, 'render_editor_panel' ) );
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
     * Get asset version string — filemtime in debug mode, plugin version in production.
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

        wp_enqueue_script(
            'itspc-editor',
            ITSPC_PLUGIN_URI . '/assets/js/itspc-editor.js',
            array(),
            $this->get_asset_version( 'assets/js/itspc-editor.js' ),
            true
        );

        wp_localize_script( 'itspc-editor', 'itspcData', array(
            'toolUrl'       => add_query_arg( 'v', ITSPC_VERSION, ITSPC_PLUGIN_URI . '/assets/tool/index.html' ),
            'panelPosition' => isset( $settings['panel_position'] ) ? $settings['panel_position'] : 'right',
            'panelWidth'    => isset( $settings['panel_width'] ) ? absint( $settings['panel_width'] ) : 420,
            'pluginVersion' => ITSPC_VERSION,
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

        wp_enqueue_style(
            'itspc-editor-css',
            ITSPC_PLUGIN_URI . '/assets/css/itspc-editor.css',
            array(),
            $this->get_asset_version( 'assets/css/itspc-editor.css' )
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
        <!-- PageCraft Toggle Button -->
        <div id="itspc-toggle-btn" title="<?php esc_attr_e( 'PageCraft (Ctrl+Shift+P)', 'pagecraft' ); ?>">
            <span class="itspc-btn-text">⚡ PageCraft</span>
        </div>

        <!-- PageCraft Sliding Panel -->
        <div id="itspc-panel" class="itspc-panel-closed itspc-pos-<?php echo esc_attr( $position ); ?>" style="width:<?php echo esc_attr( $width ); ?>px;">
            <div id="itspc-panel-resizer"></div>
            <div class="itspc-panel-header">
                <span class="itspc-panel-title">Page<span>Craft</span></span>
                <button id="itspc-panel-popout" class="itspc-panel-btn" title="<?php esc_attr_e( 'Open in new window', 'pagecraft' ); ?>">↗</button>
                <button id="itspc-panel-close" class="itspc-panel-btn" title="<?php esc_attr_e( 'Close', 'pagecraft' ); ?>">✕</button>
            </div>
            <iframe id="itspc-panel-iframe" src="" loading="lazy" title="<?php esc_attr_e( 'PageCraft Tool', 'pagecraft' ); ?>"></iframe>
        </div>
        <?php
    }
}
