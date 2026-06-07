<?php
/**
 * Admin pages and settings management.
 *
 * @package PageCraft
 */

if ( ! defined( 'ABSPATH' ) ) {
    die();
}

/**
 * Class ITSPC_Admin
 *
 * Handles WordPress admin menu, settings page, and full-screen tool page.
 */
class ITSPC_Admin {

    /**
     * Constructor — register hooks.
     */
    public function __construct() {
        add_action( 'admin_menu', array( $this, 'register_menu' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
        add_action( 'wp_dashboard_setup', array( $this, 'add_dashboard_widget' ) );
    }

    /**
     * Register admin menu pages.
     */
    public function register_menu() {
        // Top-level menu
        add_menu_page(
            __( 'PageCraft', 'pagecraft' ),
            __( 'PageCraft', 'pagecraft' ),
            'edit_posts',
            'pagecraft',
            array( $this, 'render_settings_page' ),
            'dashicons-layout',
            59
        );

        // Settings submenu (replaces auto-generated submenu)
        add_submenu_page(
            'pagecraft',
            __( 'PageCraft Settings', 'pagecraft' ),
            __( 'Settings', 'pagecraft' ),
            'edit_posts',
            'pagecraft',
            array( $this, 'render_settings_page' )
        );

        // Open Tool submenu
        add_submenu_page(
            'pagecraft',
            __( 'PageCraft Tool', 'pagecraft' ),
            __( 'Open Tool', 'pagecraft' ),
            'edit_posts',
            'pagecraft-tool',
            array( $this, 'render_tool_page' )
        );
    }


    /**
     * Sanitize settings before save.
     *
     * @param array $input Raw input array (from $_POST or Settings API).
     * @return array Sanitized settings.
     */
    public function sanitize_settings( $input ) {
        $sanitized = array();

        $sanitized['show_in_editor'] = ! empty( $input['show_in_editor'] );

        $sanitized['panel_position'] = 'right';
        if ( isset( $input['panel_position'] ) && in_array( $input['panel_position'], array( 'left', 'right' ), true ) ) {
            $sanitized['panel_position'] = $input['panel_position'];
        }

        $sanitized['panel_width'] = 420;
        if ( isset( $input['panel_width'] ) ) {
            $width = absint( $input['panel_width'] );
            $sanitized['panel_width'] = max( 380, min( 680, $width ) );
        }

        $sanitized['show_welcome_widget']   = ! empty( $input['show_welcome_widget'] );
        $sanitized['welcome_widget_agency'] = isset( $input['welcome_widget_agency'] ) ? sanitize_text_field( $input['welcome_widget_agency'] ) : '';
        $sanitized['welcome_widget_logo']   = isset( $input['welcome_widget_logo'] ) ? esc_url_raw( $input['welcome_widget_logo'] ) : '';
        $sanitized['welcome_widget_msg']    = isset( $input['welcome_widget_msg'] ) ? sanitize_textarea_field( $input['welcome_widget_msg'] ) : '';
        $sanitized['welcome_widget_video']  = isset( $input['welcome_widget_video'] ) ? esc_url_raw( $input['welcome_widget_video'] ) : '';
        $sanitized['welcome_widget_email']  = isset( $input['welcome_widget_email'] ) ? sanitize_email( $input['welcome_widget_email'] ) : '';

        return $sanitized;
    }

    /**
     * Render the settings page.
     */
    public function render_settings_page() {
        if ( ! current_user_can( 'edit_posts' ) ) {
            wp_die( esc_html__( 'You do not have sufficient permissions.', 'pagecraft' ) );
        }

        $settings = get_option( 'itspc_settings', array() );
        $settings = wp_parse_args( $settings, array(
            'show_in_editor'        => true,
            'panel_position'        => 'right',
            'panel_width'           => 420,
            'show_welcome_widget'   => false,
            'welcome_widget_agency' => '',
            'welcome_widget_logo'   => '',
            'welcome_widget_msg'    => '',
            'welcome_widget_video'  => '',
            'welcome_widget_email'  => '',
        ) );
         
        // Handle form submission
        if ( isset( $_POST['itspc_save'] ) && isset( $_POST['itspc_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['itspc_nonce'] ) ), 'itspc_save_settings' ) ) {
            // Delegate all sanitization to sanitize_settings() to avoid duplication.
            $settings = $this->sanitize_settings( wp_unslash( $_POST ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

            update_option( 'itspc_settings', $settings );

            $request_uri = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : admin_url( 'admin.php?page=pagecraft' );
            wp_safe_redirect( add_query_arg( 'saved', '1', $request_uri ) );
            exit;
        }
         
        ?>
        <div class="itspc-admin-wrap">
         
          <?php if (isset($_GET['saved'])): ?>
          <div class="itspc-notice">
            <span>✓</span> Settings saved successfully.
          </div>
          <?php endif; ?>
         
          <div class="itspc-header">
            <div>
              <div class="itspc-header-logo">Page<span>Craft</span></div>
              <div class="itspc-header-sub">Elementor Workflow Companion</div>
            </div>
            <div class="itspc-version-badge">v<?php echo esc_html(ITSPC_VERSION); ?></div>
          </div>

          <!-- Tabs Navigation -->
          <div class="itspc-tabs-nav">
              <button class="itspc-tab-btn active" data-tab="settings">⚙️ Settings</button>
              <button class="itspc-tab-btn" data-tab="docs">📚 Docs & Help</button>
              <button class="itspc-tab-btn" data-tab="about">❤️ About Us</button>
          </div>

          <!-- Tab Pane 1: Settings -->
          <div class="itspc-tab-content active" id="itspc-tab-settings">
              <form method="post" action="">
                <?php wp_nonce_field('itspc_save_settings', 'itspc_nonce'); ?>
             
                <div class="itspc-card">
                  <div class="itspc-card-header">
                    <div class="itspc-card-icon">⚙️</div>
                    <div class="itspc-card-title"><?php esc_html_e( 'General Settings', 'pagecraft' ); ?></div>
                  </div>
                  <div class="itspc-card-body">
             
                    <div class="itspc-form-row">
                      <div class="itspc-form-label-wrap">
                        <label class="itspc-form-label"><?php esc_html_e( 'Show in Elementor Editor', 'pagecraft' ); ?></label>
                        <div class="itspc-form-desc"><?php esc_html_e( 'Display the PageCraft button inside the Elementor editor.', 'pagecraft' ); ?></div>
                      </div>
                      <div class="itspc-form-control">
                        <div class="itspc-toggle-control">
                          <label class="itspc-switch">
                            <input type="checkbox" name="show_in_editor" id="show_in_editor"
                              class="itspc-checkbox" value="1"
                              <?php checked($settings['show_in_editor'], true); ?>>
                            <span class="itspc-switch-slider"></span>
                          </label>
                          <span class="itspc-switch-label-text">
                            <?php esc_html_e( 'Enable PageCraft in editor', 'pagecraft' ); ?>
                          </span>
                        </div>
                      </div>
                    </div>
             
                    <div class="itspc-form-row">
                      <div class="itspc-form-label-wrap">
                        <label class="itspc-form-label" for="panel_position"><?php esc_html_e( 'Panel Position', 'pagecraft' ); ?></label>
                        <div class="itspc-form-desc"><?php esc_html_e( 'Which side of the screen the panel opens on.', 'pagecraft' ); ?></div>
                      </div>
                      <div class="itspc-form-control">
                        <div class="itspc-segmented-control">
                          <input type="radio" name="panel_position" id="panel_position_right" value="right" <?php checked($settings['panel_position'], 'right'); ?>>
                          <label for="panel_position_right" class="itspc-segment-label"><?php esc_html_e( 'Right Side', 'pagecraft' ); ?></label>

                          <input type="radio" name="panel_position" id="panel_position_left" value="left" <?php checked($settings['panel_position'], 'left'); ?>>
                          <label for="panel_position_left" class="itspc-segment-label"><?php esc_html_e( 'Left Side', 'pagecraft' ); ?></label>
                          
                          <span class="itspc-segmented-slider"></span>
                        </div>
                      </div>
                    </div>
             
                    <div class="itspc-form-row">
                      <div class="itspc-form-label-wrap">
                        <label class="itspc-form-label" for="panel_width"><?php esc_html_e( 'Panel Width (px)', 'pagecraft' ); ?></label>
                        <div class="itspc-form-desc"><?php esc_html_e( 'Width of the tool panel (380–680px).', 'pagecraft' ); ?></div>
                      </div>
                      <div class="itspc-form-control" style="display: flex; align-items: center; gap: 10px;">
                        <input type="number" name="panel_width" id="panel_width"
                          class="itspc-input" style="max-width:80px"
                          value="<?php echo esc_attr($settings['panel_width']); ?>"
                          min="380" max="680">
                        <input type="range" id="panel_width_range" class="itspc-range-slider" min="380" max="680" step="10" value="<?php echo esc_attr($settings['panel_width']); ?>">
                        <span id="panel_width_val" style="font-size: 13.5px; font-weight: 600; color: #4B5563;"></span>
                      </div>
                    </div>
             
                  </div>
                </div>

                <!-- Client Handover & White-Label Widget Card -->
                <div class="itspc-card">
                  <div class="itspc-card-header">
                    <div class="itspc-card-icon">💼</div>
                    <div class="itspc-card-title"><?php esc_html_e( 'Client Handover & White-Label Widget', 'pagecraft' ); ?></div>
                  </div>
                  <div class="itspc-card-body">

                    <div class="itspc-form-row">
                      <div class="itspc-form-label-wrap">
                        <label class="itspc-form-label"><?php esc_html_e( 'Enable Welcome Widget', 'pagecraft' ); ?></label>
                        <div class="itspc-form-desc"><?php esc_html_e( 'Show a white-labeled support and resource widget on the WordPress admin dashboard.', 'pagecraft' ); ?></div>
                      </div>
                      <div class="itspc-form-control">
                        <div class="itspc-toggle-control">
                          <label class="itspc-switch">
                            <input type="checkbox" name="show_welcome_widget" id="show_welcome_widget" value="1"
                              <?php checked( ! empty( $settings['show_welcome_widget'] ), true ); ?>>
                            <span class="itspc-switch-slider"></span>
                          </label>
                          <span class="itspc-switch-label-text">
                            <?php esc_html_e( 'Enable Dashboard Widget', 'pagecraft' ); ?>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div id="itspc-whitelabel-fields">
                      <div class="itspc-form-row">
                        <div class="itspc-form-label-wrap">
                          <label class="itspc-form-label" for="welcome_widget_agency"><?php esc_html_e( 'Developer / Agency Name', 'pagecraft' ); ?></label>
                          <div class="itspc-form-desc"><?php esc_html_e( 'Your brand or agency name shown in the widget header.', 'pagecraft' ); ?></div>
                        </div>
                        <div class="itspc-form-control">
                          <input type="text" name="welcome_widget_agency" id="welcome_widget_agency"
                            class="itspc-input" value="<?php echo esc_attr( isset( $settings['welcome_widget_agency'] ) ? $settings['welcome_widget_agency'] : '' ); ?>"
                            placeholder="<?php esc_attr_e( 'e.g. Acme Web Agency', 'pagecraft' ); ?>">
                        </div>
                      </div>

                      <div class="itspc-form-row">
                        <div class="itspc-form-label-wrap">
                          <label class="itspc-form-label" for="welcome_widget_logo"><?php esc_html_e( 'Agency Logo URL', 'pagecraft' ); ?></label>
                          <div class="itspc-form-desc"><?php esc_html_e( 'Optional logo image URL (recommended size: 80x80px).', 'pagecraft' ); ?></div>
                        </div>
                        <div class="itspc-form-control">
                          <input type="url" name="welcome_widget_logo" id="welcome_widget_logo"
                            class="itspc-input" value="<?php echo esc_url( isset( $settings['welcome_widget_logo'] ) ? $settings['welcome_widget_logo'] : '' ); ?>"
                            placeholder="<?php esc_attr_e( 'e.g. https://youragency.com/logo.png', 'pagecraft' ); ?>">
                        </div>
                      </div>

                      <div class="itspc-form-row">
                        <div class="itspc-form-label-wrap">
                          <label class="itspc-form-label" for="welcome_widget_msg"><?php esc_html_e( 'Welcome Message / Guidelines', 'pagecraft' ); ?></label>
                          <div class="itspc-form-desc"><?php esc_html_e( 'Guidance notes or instructions for the client when they manage their site.', 'pagecraft' ); ?></div>
                        </div>
                        <div class="itspc-form-control">
                          <textarea name="welcome_widget_msg" id="welcome_widget_msg"
                            class="itspc-input" style="min-height: 100px;"
                            placeholder="<?php esc_attr_e( 'Welcome to your new website! Here you can manage your pages and posts. If you need any assistance, reach out to us using the contact details below.', 'pagecraft' ); ?>"><?php echo esc_textarea( isset( $settings['welcome_widget_msg'] ) ? $settings['welcome_widget_msg'] : '' ); ?></textarea>
                        </div>
                      </div>

                      <div class="itspc-form-row">
                        <div class="itspc-form-label-wrap">
                          <label class="itspc-form-label" for="welcome_widget_video"><?php esc_html_e( 'Video Tutorial URL (YouTube/Vimeo)', 'pagecraft' ); ?></label>
                          <div class="itspc-form-desc"><?php esc_html_e( 'A link to a video tutorial helping clients edit and manage their website.', 'pagecraft' ); ?></div>
                        </div>
                        <div class="itspc-form-control">
                          <input type="url" name="welcome_widget_video" id="welcome_widget_video"
                            class="itspc-input" value="<?php echo esc_url( isset( $settings['welcome_widget_video'] ) ? $settings['welcome_widget_video'] : '' ); ?>"
                            placeholder="<?php esc_attr_e( 'e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'pagecraft' ); ?>">
                        </div>
                      </div>

                      <div class="itspc-form-row">
                        <div class="itspc-form-label-wrap">
                          <label class="itspc-form-label" for="welcome_widget_email"><?php esc_html_e( 'Support Email / Contact', 'pagecraft' ); ?></label>
                          <div class="itspc-form-desc"><?php esc_html_e( 'The support email address where clients can send requests.', 'pagecraft' ); ?></div>
                        </div>
                        <div class="itspc-form-control">
                          <input type="text" name="welcome_widget_email" id="welcome_widget_email"
                            class="itspc-input" value="<?php echo esc_attr( isset( $settings['welcome_widget_email'] ) ? $settings['welcome_widget_email'] : '' ); ?>"
                            placeholder="<?php esc_attr_e( 'e.g. support@youragency.com', 'pagecraft' ); ?>">
                        </div>
                      </div>

                      <div class="itspc-preview-container-wrap" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
                        <div class="itspc-preview-title" style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px;">
                          <?php esc_html_e( 'Live Preview', 'pagecraft' ); ?>
                        </div>
                        <div id="itspc-widget-preview" class="itspc-widget-preview">
                          <div class="itspc-preview-header">
                            <img id="itspc-preview-logo" src="" class="itspc-preview-logo" alt="" style="display: none;">
                            <div class="itspc-preview-title-wrap">
                              <h4 id="itspc-preview-agency" class="itspc-preview-agency-name"></h4>
                              <span class="itspc-preview-badge"><?php esc_html_e( 'Website Partner', 'pagecraft' ); ?></span>
                            </div>
                          </div>
                          <div id="itspc-preview-msg" class="itspc-preview-msg"></div>
                          <div id="itspc-preview-footer" class="itspc-preview-footer">
                            <div class="itspc-preview-footer-left">
                              <span class="dashicons dashicons-email"></span>
                              <span>
                                <?php esc_html_e( 'Support:', 'pagecraft' ); ?>
                                <span id="itspc-preview-email"></span>
                              </span>
                            </div>
                            <span id="itspc-preview-video-wrap" style="display: none;">
                              <a id="itspc-preview-video-link" href="#" target="_blank" class="itspc-preview-video-link">
                                ▶ <?php esc_html_e( 'Watch tutorial', 'pagecraft' ); ?>
                              </a>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <button type="submit" name="itspc_save" class="itspc-btn-save">
                  <span>✓</span> <?php esc_html_e( 'Save Settings', 'pagecraft' ); ?>
                </button>
             
              </form>
             
              <div class="itspc-launch-card" style="margin-top:24px">
                <div class="itspc-launch-title"><?php esc_html_e( 'Quick Launch', 'pagecraft' ); ?></div>
                <div class="itspc-launch-desc">
                  <?php esc_html_e( 'Open the full PageCraft tool in a dedicated admin page.', 'pagecraft' ); ?>
                </div>
                <a href="<?php echo esc_url(admin_url('admin.php?page=pagecraft-tool')); ?>"
                   class="itspc-btn-launch">
                  ⚡ <?php esc_html_e( 'Open PageCraft Tool', 'pagecraft' ); ?>
                </a>
              </div>

              <!-- System Health & Tools Grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px;">
                  <!-- Card: System Status -->
                  <div class="itspc-card" style="margin-bottom: 0;">
                      <div class="itspc-card-header">
                          <div class="itspc-card-icon">🏥</div>
                          <div class="itspc-card-title"><?php esc_html_e( 'System Status', 'pagecraft' ); ?></div>
                      </div>
                      <div class="itspc-card-body" style="padding: 16px 20px;">
                          <div class="itspc-status-row" style="display:flex; justify-content:space-between; font-size:13.5px; margin-bottom:8px;">
                              <span style="color:#4B5563;"><?php esc_html_e( 'Elementor Builder:', 'pagecraft' ); ?></span>
                              <?php if ( did_action( 'elementor/loaded' ) ) : ?>
                                  <span style="color:#C8FF00; font-weight:600;">● <?php esc_html_e( 'Active', 'pagecraft' ); ?></span>
                              <?php else : ?>
                                  <span style="color:#FF4D4D; font-weight:600;">● <?php esc_html_e( 'Inactive', 'pagecraft' ); ?></span>
                              <?php endif; ?>
                          </div>
                          <div class="itspc-status-row" style="display:flex; justify-content:space-between; font-size:13.5px; margin-bottom:8px;">
                              <span style="color:#4B5563;"><?php esc_html_e( 'PHP Version:', 'pagecraft' ); ?></span>
                              <span style="color:#111827;"><?php echo esc_html( phpversion() ); ?> (<?php echo version_compare( phpversion(), '7.4', '>=' ) ? '✓' : '✗'; ?>)</span>
                          </div>
                          <div class="itspc-status-row" style="display:flex; justify-content:space-between; font-size:13.5px;">
                              <span style="color:#4B5563;"><?php esc_html_e( 'Active Theme:', 'pagecraft' ); ?></span>
                              <?php $active_theme = wp_get_theme()->get( 'Name' ); ?>
                              <span style="color:#111827; font-weight:500; overflow:hidden; text-overflow:ellipsis; max-width:140px; white-space:nowrap;" title="<?php echo esc_attr( $active_theme ); ?>"><?php echo esc_html( $active_theme ); ?></span>
                          </div>
                      </div>
                  </div>

                  <!-- Card: Data Maintenance -->
                  <div class="itspc-card" style="margin-bottom: 0;">
                      <div class="itspc-card-header">
                          <div class="itspc-card-icon">🧼</div>
                          <div class="itspc-card-title"><?php esc_html_e( 'Data Maintenance', 'pagecraft' ); ?></div>
                      </div>
                      <div class="itspc-card-body" style="padding: 16px 20px;">
                          <p style="font-size:13.5px; color:#4B5563; margin-top:0; margin-bottom:12px; line-height:1.55;">
                              <?php esc_html_e( 'Having sync issues? Clear PageCraft data from this browser\'s local storage cache to start fresh.', 'pagecraft' ); ?>
                          </p>
                          <button type="button" class="itspc-btn-save" id="itspc-reset-cache-btn" style="background:#FF4D4D; color:#fff; font-size:13px; padding:8px 14px; margin:0; border-radius:6px;">
                              🗑️ <?php esc_html_e( 'Reset Browser Cache', 'pagecraft' ); ?>
                          </button>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Tab Pane 2: Docs & Help -->
          <div class="itspc-tab-content" id="itspc-tab-docs">
 
            <!-- Quick Start Timeline -->
            <div class="itspc-card" style="margin-bottom:16px">
              <div class="itspc-card-header">
                <div class="itspc-card-icon">🚀</div>
                <div class="itspc-card-title"><?php esc_html_e( 'Quick Start — 3 Steps', 'pagecraft' ); ?></div>
              </div>
              <div class="itspc-card-body" style="padding:0">
                <div class="itspc-steps">
 
                  <div class="itspc-step">
                    <div class="itspc-step-num">1</div>
                    <div class="itspc-step-content">
                      <div class="itspc-step-title"><?php esc_html_e( 'Activate & Open Elementor', 'pagecraft' ); ?></div>
                      <div class="itspc-step-desc"><?php esc_html_e( 'Make sure PageCraft is activated. Open any page or post in Elementor editor.', 'pagecraft' ); ?></div>
                    </div>
                  </div>
 
                  <div class="itspc-step">
                    <div class="itspc-step-num">2</div>
                    <div class="itspc-step-content">
                      <div class="itspc-step-title"><?php esc_html_e( 'Launch the Panel', 'pagecraft' ); ?></div>
                      <div class="itspc-step-desc">
                        <?php esc_html_e( 'Click the floating', 'pagecraft' ); ?>
                        <span class="itspc-inline-badge">⚡ PageCraft</span>
                        <?php esc_html_e( 'button (bottom-right), or press', 'pagecraft' ); ?>
                        <kbd class="itspc-kbd">Ctrl</kbd>+<kbd class="itspc-kbd">Shift</kbd>+<kbd class="itspc-kbd">P</kbd>
                      </div>
                    </div>
                  </div>
 
                  <div class="itspc-step" style="border-bottom:none">
                    <div class="itspc-step-num">3</div>
                    <div class="itspc-step-content">
                      <div class="itspc-step-title"><?php esc_html_e( 'Plan, Design, Ship', 'pagecraft' ); ?></div>
                      <div class="itspc-step-desc"><?php esc_html_e( 'Use the 6 modules: Section Planner, Checklist, Color Palette, Font Pairs, CSS Generator, and Notes — all saved automatically.', 'pagecraft' ); ?></div>
                    </div>
                  </div>
 
                </div>
              </div>
            </div>
 
            <!-- Feature Cards -->
            <div class="itspc-card" style="margin-bottom:16px">
              <div class="itspc-card-header">
                <div class="itspc-card-icon">🧩</div>
                <div class="itspc-card-title"><?php esc_html_e( 'Interactive Feature Guide', 'pagecraft' ); ?></div>
              </div>
              <div class="itspc-card-body">
                <p style="font-size: 14px; color: #4B5563; margin-top: 0; margin-bottom: 16px;">
                  <?php esc_html_e( 'Explore each PageCraft module below. Click on any card to see a step-by-step usage guide and developer pro-tips.', 'pagecraft' ); ?>
                </p>
                <div class="itspc-feature-grid">
 
                  <div class="itspc-feature-card active" data-feature="planner">
                    <div class="itspc-feature-icon">📐</div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Section Planner', 'pagecraft' ); ?></div>
                  </div>
 
                  <div class="itspc-feature-card" data-feature="checklist">
                    <div class="itspc-feature-icon">✅</div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Design Checklist', 'pagecraft' ); ?></div>
                  </div>
 
                  <div class="itspc-feature-card" data-feature="palette">
                    <div class="itspc-feature-icon">🎨</div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Color Palette', 'pagecraft' ); ?></div>
                  </div>
 
                  <div class="itspc-feature-card" data-feature="fonts">
                    <div class="itspc-feature-icon">🔤</div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Font Pairing', 'pagecraft' ); ?></div>
                  </div>
 
                  <div class="itspc-feature-card" data-feature="css">
                    <div class="itspc-feature-icon">💻</div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'CSS Generator', 'pagecraft' ); ?></div>
                  </div>
 
                  <div class="itspc-feature-card" data-feature="notes">
                    <div class="itspc-feature-icon">📝</div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Project Notes', 'pagecraft' ); ?></div>
                  </div>
 
                </div>

                <!-- Feature Details Explorer Panel -->
                <div id="itspc-feature-detail-panel" class="itspc-feature-detail-panel">
                  <!-- JS will load details here -->
                </div>
              </div>
            </div>
 
            <!-- FAQ Accordion -->
            <div class="itspc-card" style="margin-bottom:16px">
              <div class="itspc-card-header">
                <div class="itspc-card-icon">❓</div>
                <div class="itspc-card-title"><?php esc_html_e( 'Frequently Asked Questions', 'pagecraft' ); ?></div>
              </div>
              <div class="itspc-card-body" style="padding:0">
                <div class="itspc-accordion">
 
                  <div class="itspc-accordion-item">
                    <button class="itspc-accordion-btn" type="button">
                      <span><?php esc_html_e( 'Does PageCraft require Elementor Pro?', 'pagecraft' ); ?></span>
                      <span class="itspc-accordion-arrow">▾</span>
                    </button>
                    <div class="itspc-accordion-body">
                      <p><?php esc_html_e( 'No. PageCraft works with the free version of Elementor. No Pro license needed.', 'pagecraft' ); ?></p>
                    </div>
                  </div>
 
                  <div class="itspc-accordion-item">
                    <button class="itspc-accordion-btn" type="button">
                      <span><?php esc_html_e( 'Where is my data stored?', 'pagecraft' ); ?></span>
                      <span class="itspc-accordion-arrow">▾</span>
                    </button>
                    <div class="itspc-accordion-body">
                      <p><?php esc_html_e( 'All your project data (sections, colors, notes, etc.) is stored in your browser\'s localStorage. It stays on your device and is never sent to any server. Use the Export → JSON feature to back it up.', 'pagecraft' ); ?></p>
                    </div>
                  </div>
 
                  <div class="itspc-accordion-item">
                    <button class="itspc-accordion-btn" type="button">
                      <span><?php esc_html_e( 'Will it slow down my website?', 'pagecraft' ); ?></span>
                      <span class="itspc-accordion-arrow">▾</span>
                    </button>
                    <div class="itspc-accordion-body">
                      <p><?php esc_html_e( 'PageCraft only loads its scripts inside the Elementor editor — never on your frontend. Your site\'s load time is completely unaffected.', 'pagecraft' ); ?></p>
                    </div>
                  </div>
 
                  <div class="itspc-accordion-item">
                    <button class="itspc-accordion-btn" type="button">
                      <span><?php esc_html_e( 'Can I use it for multiple client projects?', 'pagecraft' ); ?></span>
                      <span class="itspc-accordion-arrow">▾</span>
                    </button>
                    <div class="itspc-accordion-body">
                      <p><?php esc_html_e( 'Yes. Use the Projects feature inside the tool to create separate workspaces for each client. Each project has its own sections, colors, palette, and notes.', 'pagecraft' ); ?></p>
                    </div>
                  </div>
 
                  <div class="itspc-accordion-item" style="border-bottom:none">
                    <button class="itspc-accordion-btn" type="button">
                      <span><?php esc_html_e( 'How do I back up or move my data?', 'pagecraft' ); ?></span>
                      <span class="itspc-accordion-arrow">▾</span>
                    </button>
                    <div class="itspc-accordion-body">
                      <p><?php esc_html_e( 'Open the tool → go to the Export tab → click "Download JSON". This saves all your projects. To restore, click "Import JSON" on any browser/device.', 'pagecraft' ); ?></p>
                    </div>
                  </div>
 
                </div>
              </div>
            </div>
 
            <!-- Keyboard Shortcuts -->
            <div class="itspc-card">
              <div class="itspc-card-header">
                <div class="itspc-card-icon">⌨️</div>
                <div class="itspc-card-title"><?php esc_html_e( 'Keyboard Shortcuts', 'pagecraft' ); ?></div>
              </div>
              <div class="itspc-card-body" style="padding:0">
                <div class="itspc-shortcut-list" style="border:none;border-radius:0;background:transparent;padding:0 24px">
                  <div class="itspc-shortcut-item">
                    <span><?php esc_html_e( 'Toggle Panel (Show / Hide)', 'pagecraft' ); ?></span>
                    <span class="itspc-shortcut-keys"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd></span>
                  </div>
                  <div class="itspc-shortcut-item">
                    <span><?php esc_html_e( 'Close Panel', 'pagecraft' ); ?></span>
                    <span class="itspc-shortcut-keys"><kbd>Esc</kbd></span>
                  </div>
                  <div class="itspc-shortcut-item" style="border-bottom:none">
                    <span><?php esc_html_e( 'Navigate Tabs (inside tool)', 'pagecraft' ); ?></span>
                    <span class="itspc-shortcut-keys"><kbd>Tab</kbd></span>
                  </div>
                </div>
              </div>
            </div>
 
          </div>
          <!-- End Tab Pane 2 -->

          <!-- Tab Pane 3: About Us -->
          <div class="itspc-tab-content" id="itspc-tab-about">
              <div class="itspc-card">
                  <div class="itspc-card-header">
                      <div class="itspc-card-icon">❤️</div>
                      <div class="itspc-card-title"><?php esc_html_e( 'About TheReadScope', 'pagecraft' ); ?></div>
                  </div>
                  <div class="itspc-card-body">
                      <div class="itspc-about-grid">
                          <div class="itspc-about-text">
                              <div class="itspc-about-logo">Page<span>Craft</span></div>
                              <p style="margin-top: 12px; font-size: 14px; color: #6B7280; font-weight: 500;"><?php esc_html_e( 'Brought to you by TheReadScope', 'pagecraft' ); ?></p>
                              <p><?php esc_html_e( 'We are a dedicated team of WordPress developers building modern workflow companion utilities to optimize your web development process. PageCraft was born out of the need to eliminate browser tab clutter and app-switching fatigue while planning and structuring Elementor layouts.', 'pagecraft' ); ?></p>
                              <p><?php esc_html_e( 'If PageCraft helps you design better websites faster, please consider giving us a review on WordPress.org to support the ongoing development of this 100% free plugin!', 'pagecraft' ); ?></p>
                              
                              <div style="margin-top: 24px; display: flex; gap: 20px;">
                                  <a href="https://thereadscope.com/" target="_blank" class="itspc-link-btn">🌐 <?php esc_html_e( 'Visit Website', 'pagecraft' ); ?></a>
                                  <a href="https://thereadscope.com/pagecraft/" target="_blank" class="itspc-link-btn">💬 <?php esc_html_e( 'Get Support', 'pagecraft' ); ?></a>
                                  <a href="https://wordpress.org/support/plugin/pagecraft/reviews/" target="_blank" class="itspc-link-btn">⭐ <?php esc_html_e( 'Rate & Review', 'pagecraft' ); ?></a>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>


        </div>
        <?php
    }

    /**
     * Render the full-screen tool page.
     */
    public function render_tool_page() {
        if ( ! current_user_can( 'edit_posts' ) ) {
            wp_die( esc_html__( 'You do not have sufficient permissions.', 'pagecraft' ) );
        }

        $tool_url = esc_url( add_query_arg( 'v', ITSPC_VERSION, ITSPC_PLUGIN_URI . '/assets/tool/index.html' ) );
        ?>

        <a href="<?php echo esc_url( admin_url( 'admin.php?page=pagecraft' ) ); ?>" class="itspc-back-link">
            ← <?php esc_html_e( 'Back to Dashboard', 'pagecraft' ); ?>
        </a>
        <iframe
            src="<?php echo esc_url( $tool_url ); ?>"
            style="width:100%;height:100vh;border:none;display:block;"
            title="<?php esc_attr_e( 'PageCraft Tool', 'pagecraft' ); ?>"
        ></iframe>
        <?php
    }

    /**
     * Add client handover dashboard widget if enabled.
     */
    public function add_dashboard_widget() {
        $settings = get_option( 'itspc_settings', array() );
        $enabled  = isset( $settings['show_welcome_widget'] ) ? (bool) $settings['show_welcome_widget'] : false;

        if ( $enabled ) {
            wp_add_dashboard_widget(
                'itspc_welcome_dashboard_widget',
                isset( $settings['welcome_widget_agency'] ) && ! empty( $settings['welcome_widget_agency'] )
                    ? sprintf( /* translators: %s: Agency name */ __( 'Welcome from %s', 'pagecraft' ), esc_html( $settings['welcome_widget_agency'] ) )
                    : __( 'Client Support & Resources', 'pagecraft' ),
                array( $this, 'render_dashboard_widget' )
            );
        }
    }

    /**
     * Parse YouTube/Vimeo URLs to generate responsive iframe embeds.
     *
     * @param string $url The video URL.
     * @return string The embed HTML or fallback button.
     */
    private function get_video_embed_html( $url ) {
        if ( empty( $url ) ) {
            return '';
        }

        // YouTube parsing
        if ( preg_match( '/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i', $url, $matches ) ) {
            $video_id = $matches[1];
            return '<div class="itspc-video-container"><iframe src="https://www.youtube.com/embed/' . esc_attr( $video_id ) . '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
        }

        // Vimeo parsing
        if ( preg_match( '/vimeo\.com\/(?:video\/)?([0-9]+)/i', $url, $matches ) ) {
            $video_id = $matches[1];
            return '<div class="itspc-video-container"><iframe src="https://player.vimeo.com/video/' . esc_attr( $video_id ) . '" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>';
        }

        // Fallback to a styled link button
        return '<div class="itspc-video-fallback"><a href="' . esc_url( $url ) . '" target="_blank" class="button button-secondary"><span class="dashicons dashicons-video-alt3" style="vertical-align: middle; margin-right: 5px;"></span>' . esc_html__( 'Watch Video Tutorial', 'pagecraft' ) . '</a></div>';
    }

    /**
     * Render the dashboard welcome widget content.
     */
    public function render_dashboard_widget() {
        $settings = get_option( 'itspc_settings', array() );
        $settings = wp_parse_args( $settings, array(
            'welcome_widget_agency' => '',
            'welcome_widget_logo'   => '',
            'welcome_widget_msg'    => '',
            'welcome_widget_video'  => '',
            'welcome_widget_email'  => '',
        ) );

        $agency_name = ! empty( $settings['welcome_widget_agency'] ) ? $settings['welcome_widget_agency'] : __( 'Acme Agency', 'pagecraft' );
        $logo_url    = $settings['welcome_widget_logo'];
        $msg         = $settings['welcome_widget_msg'];
        $video_url   = $settings['welcome_widget_video'];
        $email       = $settings['welcome_widget_email'];
        ?>
        <div class="itspc-dashboard-widget-wrap">
            <div class="itspc-widget-header">
                <?php if ( ! empty( $logo_url ) ) : ?>
                    <img src="<?php echo esc_url( $logo_url ); ?>" class="itspc-widget-logo" alt="<?php echo esc_attr( $agency_name ); ?>">
                <?php else : ?>
                    <div class="itspc-widget-logo-placeholder">⚡</div>
                <?php endif; ?>
                <div class="itspc-widget-title-wrap">
                    <h4 class="itspc-widget-agency-name"><?php echo esc_html( $agency_name ); ?></h4>
                    <span class="itspc-widget-badge"><?php esc_html_e( 'Website Partner', 'pagecraft' ); ?></span>
                </div>
            </div>

            <?php if ( ! empty( $msg ) ) : ?>
                <div class="itspc-widget-msg">
                    <?php echo wp_kses_post( nl2br( $msg ) ); ?>
                </div>
            <?php else : ?>
                <div class="itspc-widget-msg">
                    <?php esc_html_e( 'Welcome to your site administration dashboard! If you need support or updates, feel free to contact us anytime.', 'pagecraft' ); ?>
                </div>
            <?php endif; ?>

            <?php if ( ! empty( $video_url ) ) : ?>
                <?php echo $this->get_video_embed_html( $video_url ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
            <?php endif; ?>

            <?php if ( ! empty( $email ) ) : ?>
                <div class="itspc-widget-footer">
                    <div class="itspc-widget-footer-left">
                        <span class="dashicons dashicons-email"></span>
                        <span>
                            <?php esc_html_e( 'Support Email:', 'pagecraft' ); ?>
                            <a href="mailto:<?php echo esc_attr( $email ); ?>" class="itspc-widget-email-link"><?php echo esc_html( $email ); ?></a>
                        </span>
                    </div>
                    <a href="mailto:<?php echo esc_attr( $email ); ?>" class="itspc-support-btn">
                        <?php esc_html_e( 'Request Support', 'pagecraft' ); ?>
                    </a>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Enqueue admin scripts and styles.
     *
     * Loads:
     * — itspc-admin.css on all plugin pages and on the dashboard when the widget is active.
     * — itspc-admin.js (tab switching, accordion, cache reset) on plugin pages.
     * — itspc-tool-page.css only on the pagecraft-tool sub-page.
     *
     * @param string $hook Current admin page hook suffix.
     */
    public function enqueue_admin_scripts( $hook ) {
        $is_pagecraft = false !== strpos( $hook, 'pagecraft' );
        $is_dashboard = 'index.php' === $hook;

        // Load CSS on the WP dashboard when the welcome widget is active.
        if ( $is_dashboard ) {
            $settings = get_option( 'itspc_settings', array() );
            if ( ! empty( $settings['show_welcome_widget'] ) ) {
                wp_enqueue_style(
                    'itspc-admin',
                    ITSPC_PLUGIN_URI . '/assets/css/itspc-admin.css',
                    array(),
                    ITSPC_VERSION
                );
            }
        }

        // Everything below is for plugin pages only.
        if ( ! $is_pagecraft ) {
            return;
        }

        wp_enqueue_style(
            'itspc-admin',
            ITSPC_PLUGIN_URI . '/assets/css/itspc-admin.css',
            array(),
            ITSPC_VERSION
        );

        wp_enqueue_script(
            'itspc-admin',
            ITSPC_PLUGIN_URI . '/assets/js/itspc-admin.js',
            array(),
            ITSPC_VERSION,
            true
        );

        wp_localize_script(
            'itspc-admin',
            'itspcAdminData',
            array(
                'confirmReset' => __( 'Are you sure you want to reset all PageCraft tool data? This will permanently delete all planner structures, palettes, and checklists from this browser.', 'pagecraft' ),
                'resetSuccess' => __( 'All browser cached data for PageCraft has been successfully cleared.', 'pagecraft' ),
            )
        );

        // Tool page: fullscreen CSS override (hides admin bar, sidebar, footer).
        if ( false !== strpos( $hook, 'pagecraft-tool' ) ) {
            wp_enqueue_style(
                'itspc-tool-page',
                ITSPC_PLUGIN_URI . '/assets/css/itspc-tool-page.css',
                array( 'itspc-admin' ),
                ITSPC_VERSION
            );
        }
    }
}
