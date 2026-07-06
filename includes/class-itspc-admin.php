<?php
/**
 * Admin pages and settings management.
 *
 * @package Sekkei
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
     * Constructor - register hooks.
     */
    public function __construct() {
        add_action( 'admin_menu', array( $this, 'register_menu' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
        add_action( 'wp_dashboard_setup', array( $this, 'add_dashboard_widget' ) );
        add_action( 'wp_ajax_itspc_save_backup', array( $this, 'ajax_save_backup' ) );
        add_action( 'wp_ajax_itspc_load_backup', array( $this, 'ajax_load_backup' ) );
        add_action( 'wp_ajax_itspc_sync_elementor_globals', array( $this, 'ajax_sync_elementor_globals' ) );
    }

    /**
     * Register admin menu pages.
     */
    public function register_menu() {
        // Top-level menu
        add_menu_page(
            __( 'Sekkei', 'sekkei' ),
            __( 'Sekkei', 'sekkei' ),
            'manage_options',
            'sekkei',
            array( $this, 'render_settings_page' ),
            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj4KICA8ZyBmaWxsPSIjYTdhYWFkIj4KICAgIDxyZWN0IHg9IjMiIHk9IjMuNCIgd2lkdGg9IjExIiBoZWlnaHQ9IjIuNiIgcng9IjEuMyIvPgogICAgPHJlY3QgeD0iMyIgeT0iNy42IiB3aWR0aD0iMTQiIGhlaWdodD0iMy4yIiByeD0iMS42Ii8+CiAgICA8cmVjdCB4PSIzIiB5PSIxMi40IiB3aWR0aD0iOSIgaGVpZ2h0PSIyLjYiIHJ4PSIxLjMiLz4KICAgIDxyZWN0IHg9IjMiIHk9IjE2IiB3aWR0aD0iNiIgaGVpZ2h0PSIyLjQiIHJ4PSIxLjIiLz4KICA8L2c+Cjwvc3ZnPgo=',
            59
        );

        // Settings submenu (replaces auto-generated submenu)
        add_submenu_page(
            'sekkei',
            __( 'Sekkei Settings', 'sekkei' ),
            __( 'Settings', 'sekkei' ),
            'manage_options',
            'sekkei',
            array( $this, 'render_settings_page' )
        );

        // Open Tool submenu
        add_submenu_page(
            'sekkei',
            __( 'Sekkei Tool', 'sekkei' ),
            __( 'Open Tool', 'sekkei' ),
            'manage_options',
            'sekkei-tool',
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
        $sanitized['planner_show_health'] = ! empty( $input['planner_show_health'] );
        $sanitized['planner_show_notes']  = ! empty( $input['planner_show_notes'] );
        $sanitized['planner_show_css']    = ! empty( $input['planner_show_css'] );
        $sanitized['planner_show_badges'] = ! empty( $input['planner_show_badges'] );

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
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'You do not have sufficient permissions.', 'sekkei' ) );
        }

        $settings = get_option( 'itspc_settings', array() );
        $settings = wp_parse_args( $settings, array(
            'show_in_editor'        => true,
            'panel_position'        => 'right',
            'panel_width'           => 420,
            'planner_show_health'   => true,
            'planner_show_notes'    => true,
            'planner_show_css'      => true,
            'planner_show_badges'   => true,
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

            $request_uri = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : admin_url( 'admin.php?page=sekkei' );
            wp_safe_redirect( add_query_arg( 'saved', '1', $request_uri ) );
            exit;
        }
         
        ?>
        <div class="itspc-admin-wrap">
         
          <?php if (isset($_GET['saved'])): ?>
          <div class="itspc-notice">
            <span>OK</span> Settings saved successfully.
          </div>
          <?php endif; ?>
         
          <div class="itspc-header">
            <div>
              <div class="itspc-header-logo">Sek<span>kei</span></div>
              <div class="itspc-header-sub">Elementor Workflow Companion</div>
            </div>
            <div class="itspc-version-badge">v<?php echo esc_html(ITSPC_VERSION); ?></div>
          </div>

          <!-- Tabs Navigation -->
          <div class="itspc-tabs-nav">
              <button class="itspc-tab-btn active" data-tab="settings"> Settings</button>
              <button class="itspc-tab-btn" data-tab="docs"> Docs & Help</button>
              <button class="itspc-tab-btn" data-tab="about"> About Us</button>
          </div>

          <!-- Tab Pane 1: Settings -->
          <div class="itspc-tab-content active" id="itspc-tab-settings">
              <form method="post" action="">
                <?php wp_nonce_field('itspc_save_settings', 'itspc_nonce'); ?>
             
                <div class="itspc-card">
                  <div class="itspc-card-header">
                    <div class="itspc-card-icon"></div>
                    <div class="itspc-card-title"><?php esc_html_e( 'General Settings', 'sekkei' ); ?></div>
                  </div>
                  <div class="itspc-card-body">
             
                    <div class="itspc-form-row">
                      <div class="itspc-form-label-wrap">
                        <label class="itspc-form-label"><?php esc_html_e( 'Show in Elementor Editor', 'sekkei' ); ?></label>
                        <div class="itspc-form-desc"><?php esc_html_e( 'Display the Sekkei button inside the Elementor editor.', 'sekkei' ); ?></div>
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
                            <?php esc_html_e( 'Enable Sekkei in editor', 'sekkei' ); ?>
                          </span>
                        </div>
                      </div>
                    </div>
             
                    <div class="itspc-form-row">
                      <div class="itspc-form-label-wrap">
                        <label class="itspc-form-label" for="panel_position"><?php esc_html_e( 'Panel Position', 'sekkei' ); ?></label>
                        <div class="itspc-form-desc"><?php esc_html_e( 'Which side of the screen the panel opens on.', 'sekkei' ); ?></div>
                      </div>
                      <div class="itspc-form-control">
                        <div class="itspc-segmented-control">
                          <input type="radio" name="panel_position" id="panel_position_right" value="right" <?php checked($settings['panel_position'], 'right'); ?>>
                          <label for="panel_position_right" class="itspc-segment-label"><?php esc_html_e( 'Right Side', 'sekkei' ); ?></label>

                          <input type="radio" name="panel_position" id="panel_position_left" value="left" <?php checked($settings['panel_position'], 'left'); ?>>
                          <label for="panel_position_left" class="itspc-segment-label"><?php esc_html_e( 'Left Side', 'sekkei' ); ?></label>
                          
                          <span class="itspc-segmented-slider"></span>
                        </div>
                      </div>
                    </div>
             
                    <div class="itspc-form-row">
                      <div class="itspc-form-label-wrap">
                        <label class="itspc-form-label" for="panel_width"><?php esc_html_e( 'Panel Width (px)', 'sekkei' ); ?></label>
                        <div class="itspc-form-desc"><?php esc_html_e( 'Width of the tool panel (380-680px).', 'sekkei' ); ?></div>
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

                <!-- Planner Display Settings Card -->
                <div class="itspc-card">
                  <div class="itspc-card-header">
                    <div class="itspc-card-icon"></div>
                    <div class="itspc-card-title"><?php esc_html_e( 'Planner Display', 'sekkei' ); ?></div>
                  </div>
                  <div class="itspc-card-body">

                    <div class="itspc-form-row">
                      <div class="itspc-form-label-wrap">
                        <label class="itspc-form-label"><?php esc_html_e( 'Planner Health Summary', 'sekkei' ); ?></label>
                        <div class="itspc-form-desc"><?php esc_html_e( 'Show the score and page-level warnings above the section list.', 'sekkei' ); ?></div>
                      </div>
                      <div class="itspc-form-control">
                        <div class="itspc-toggle-control">
                          <label class="itspc-switch">
                            <input type="checkbox" name="planner_show_health" value="1" <?php checked( ! empty( $settings['planner_show_health'] ), true ); ?>>
                            <span class="itspc-switch-slider"></span>
                          </label>
                          <span class="itspc-switch-label-text"><?php esc_html_e( 'Show health summary', 'sekkei' ); ?></span>
                        </div>
                      </div>
                    </div>

                    <div class="itspc-form-row">
                      <div class="itspc-form-label-wrap">
                        <label class="itspc-form-label"><?php esc_html_e( 'Section Notes', 'sekkei' ); ?></label>
                        <div class="itspc-form-desc"><?php esc_html_e( 'Show section notes inside each planner card.', 'sekkei' ); ?></div>
                      </div>
                      <div class="itspc-form-control">
                        <div class="itspc-toggle-control">
                          <label class="itspc-switch">
                            <input type="checkbox" name="planner_show_notes" value="1" <?php checked( ! empty( $settings['planner_show_notes'] ), true ); ?>>
                            <span class="itspc-switch-slider"></span>
                          </label>
                          <span class="itspc-switch-label-text"><?php esc_html_e( 'Show notes', 'sekkei' ); ?></span>
                        </div>
                      </div>
                    </div>

                    <div class="itspc-form-row">
                      <div class="itspc-form-label-wrap">
                        <label class="itspc-form-label"><?php esc_html_e( 'CSS Labels', 'sekkei' ); ?></label>
                        <div class="itspc-form-desc"><?php esc_html_e( 'Show saved CSS classes or IDs in planner cards.', 'sekkei' ); ?></div>
                      </div>
                      <div class="itspc-form-control">
                        <div class="itspc-toggle-control">
                          <label class="itspc-switch">
                            <input type="checkbox" name="planner_show_css" value="1" <?php checked( ! empty( $settings['planner_show_css'] ), true ); ?>>
                            <span class="itspc-switch-slider"></span>
                          </label>
                          <span class="itspc-switch-label-text"><?php esc_html_e( 'Show CSS labels', 'sekkei' ); ?></span>
                        </div>
                      </div>
                    </div>

                    <div class="itspc-form-row" style="border-bottom:none">
                      <div class="itspc-form-label-wrap">
                        <label class="itspc-form-label"><?php esc_html_e( 'Section Health Badges', 'sekkei' ); ?></label>
                        <div class="itspc-form-desc"><?php esc_html_e( 'Show Healthy, Planner only, Empty, Title, and dependency badges per section.', 'sekkei' ); ?></div>
                      </div>
                      <div class="itspc-form-control">
                        <div class="itspc-toggle-control">
                          <label class="itspc-switch">
                            <input type="checkbox" name="planner_show_badges" value="1" <?php checked( ! empty( $settings['planner_show_badges'] ), true ); ?>>
                            <span class="itspc-switch-slider"></span>
                          </label>
                          <span class="itspc-switch-label-text"><?php esc_html_e( 'Show section badges', 'sekkei' ); ?></span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <!-- Client Handover & White-Label Widget Card -->
                <div class="itspc-card">
                  <div class="itspc-card-header">
                    <div class="itspc-card-icon"></div>
                    <div class="itspc-card-title"><?php esc_html_e( 'Client Handover & White-Label Widget', 'sekkei' ); ?></div>
                  </div>
                  <div class="itspc-card-body">

                    <div class="itspc-form-row">
                      <div class="itspc-form-label-wrap">
                        <label class="itspc-form-label"><?php esc_html_e( 'Enable Welcome Widget', 'sekkei' ); ?></label>
                        <div class="itspc-form-desc"><?php esc_html_e( 'Show a white-labeled support and resource widget on the WordPress admin dashboard.', 'sekkei' ); ?></div>
                      </div>
                      <div class="itspc-form-control">
                        <div class="itspc-toggle-control">
                          <label class="itspc-switch">
                            <input type="checkbox" name="show_welcome_widget" id="show_welcome_widget" value="1"
                              <?php checked( ! empty( $settings['show_welcome_widget'] ), true ); ?>>
                            <span class="itspc-switch-slider"></span>
                          </label>
                          <span class="itspc-switch-label-text">
                            <?php esc_html_e( 'Enable Dashboard Widget', 'sekkei' ); ?>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div id="itspc-whitelabel-fields">
                      <div class="itspc-form-row">
                        <div class="itspc-form-label-wrap">
                          <label class="itspc-form-label" for="welcome_widget_agency"><?php esc_html_e( 'Developer / Agency Name', 'sekkei' ); ?></label>
                          <div class="itspc-form-desc"><?php esc_html_e( 'Your brand or agency name shown in the widget header.', 'sekkei' ); ?></div>
                        </div>
                        <div class="itspc-form-control">
                          <input type="text" name="welcome_widget_agency" id="welcome_widget_agency"
                            class="itspc-input" value="<?php echo esc_attr( isset( $settings['welcome_widget_agency'] ) ? $settings['welcome_widget_agency'] : '' ); ?>"
                            placeholder="<?php esc_attr_e( 'e.g. Acme Web Agency', 'sekkei' ); ?>">
                        </div>
                      </div>

                      <div class="itspc-form-row">
                        <div class="itspc-form-label-wrap">
                          <label class="itspc-form-label" for="welcome_widget_logo"><?php esc_html_e( 'Agency Logo URL', 'sekkei' ); ?></label>
                          <div class="itspc-form-desc"><?php esc_html_e( 'Optional logo image URL (recommended size: 80x80px).', 'sekkei' ); ?></div>
                        </div>
                        <div class="itspc-form-control">
                          <input type="url" name="welcome_widget_logo" id="welcome_widget_logo"
                            class="itspc-input" value="<?php echo esc_url( isset( $settings['welcome_widget_logo'] ) ? $settings['welcome_widget_logo'] : '' ); ?>"
                            placeholder="<?php esc_attr_e( 'e.g. https://youragency.com/logo.png', 'sekkei' ); ?>">
                        </div>
                      </div>

                      <div class="itspc-form-row">
                        <div class="itspc-form-label-wrap">
                          <label class="itspc-form-label" for="welcome_widget_msg"><?php esc_html_e( 'Welcome Message / Guidelines', 'sekkei' ); ?></label>
                          <div class="itspc-form-desc"><?php esc_html_e( 'Guidance notes or instructions for the client when they manage their site.', 'sekkei' ); ?></div>
                        </div>
                        <div class="itspc-form-control">
                          <textarea name="welcome_widget_msg" id="welcome_widget_msg"
                            class="itspc-input" style="min-height: 100px;"
                            placeholder="<?php esc_attr_e( 'Welcome to your new website! Here you can manage your pages and posts. If you need any assistance, reach out to us using the contact details below.', 'sekkei' ); ?>"><?php echo esc_textarea( isset( $settings['welcome_widget_msg'] ) ? $settings['welcome_widget_msg'] : '' ); ?></textarea>
                        </div>
                      </div>

                      <div class="itspc-form-row">
                        <div class="itspc-form-label-wrap">
                          <label class="itspc-form-label" for="welcome_widget_video"><?php esc_html_e( 'Video Tutorial URL (YouTube/Vimeo)', 'sekkei' ); ?></label>
                          <div class="itspc-form-desc"><?php esc_html_e( 'A link to a video tutorial helping clients edit and manage their website.', 'sekkei' ); ?></div>
                        </div>
                        <div class="itspc-form-control">
                          <input type="url" name="welcome_widget_video" id="welcome_widget_video"
                            class="itspc-input" value="<?php echo esc_url( isset( $settings['welcome_widget_video'] ) ? $settings['welcome_widget_video'] : '' ); ?>"
                            placeholder="<?php esc_attr_e( 'e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'sekkei' ); ?>">
                        </div>
                      </div>

                      <div class="itspc-form-row">
                        <div class="itspc-form-label-wrap">
                          <label class="itspc-form-label" for="welcome_widget_email"><?php esc_html_e( 'Support Email / Contact', 'sekkei' ); ?></label>
                          <div class="itspc-form-desc"><?php esc_html_e( 'The support email address where clients can send requests.', 'sekkei' ); ?></div>
                        </div>
                        <div class="itspc-form-control">
                          <input type="text" name="welcome_widget_email" id="welcome_widget_email"
                            class="itspc-input" value="<?php echo esc_attr( isset( $settings['welcome_widget_email'] ) ? $settings['welcome_widget_email'] : '' ); ?>"
                            placeholder="<?php esc_attr_e( 'e.g. support@youragency.com', 'sekkei' ); ?>">
                        </div>
                      </div>

                      <div class="itspc-preview-container-wrap" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
                        <div class="itspc-preview-title" style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px;">
                          <?php esc_html_e( 'Live Preview', 'sekkei' ); ?>
                        </div>
                        <div id="itspc-widget-preview" class="itspc-widget-preview">
                          <div class="itspc-preview-header">
                            <img id="itspc-preview-logo" src="" class="itspc-preview-logo" alt="" style="display: none;">
                            <div class="itspc-preview-title-wrap">
                              <h4 id="itspc-preview-agency" class="itspc-preview-agency-name"></h4>
                              <span class="itspc-preview-badge"><?php esc_html_e( 'Website Partner', 'sekkei' ); ?></span>
                            </div>
                          </div>
                          <div id="itspc-preview-msg" class="itspc-preview-msg"></div>
                          <div id="itspc-preview-footer" class="itspc-preview-footer">
                            <div class="itspc-preview-footer-left">
                              <span class="dashicons dashicons-email"></span>
                              <span>
                                <?php esc_html_e( 'Support:', 'sekkei' ); ?>
                                <span id="itspc-preview-email"></span>
                              </span>
                            </div>
                            <span id="itspc-preview-video-wrap" style="display: none;">
                              <a id="itspc-preview-video-link" href="#" target="_blank" rel="noopener noreferrer" class="itspc-preview-video-link">
                                > <?php esc_html_e( 'Watch tutorial', 'sekkei' ); ?>
                              </a>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <button type="submit" name="itspc_save" class="itspc-btn-save">
                  <span>OK</span> <?php esc_html_e( 'Save Settings', 'sekkei' ); ?>
                </button>
             
              </form>
             
              <div class="itspc-launch-card" style="margin-top:24px">
                <div class="itspc-launch-title"><?php esc_html_e( 'Quick Launch', 'sekkei' ); ?></div>
                <div class="itspc-launch-desc">
                  <?php esc_html_e( 'Open the full Sekkei tool in a dedicated admin page.', 'sekkei' ); ?>
                </div>
                <a href="<?php echo esc_url(admin_url('admin.php?page=sekkei-tool')); ?>"
                   class="itspc-btn-launch">
                  <?php esc_html_e( 'Open Sekkei Tool', 'sekkei' ); ?>
                </a>
              </div>

              <!-- System Health & Tools Grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px;">
                  <!-- Card: System Status -->
                  <div class="itspc-card" style="margin-bottom: 0;">
                      <div class="itspc-card-header">
                          <div class="itspc-card-icon"></div>
                          <div class="itspc-card-title"><?php esc_html_e( 'System Status', 'sekkei' ); ?></div>
                      </div>
                      <div class="itspc-card-body" style="padding: 16px 20px;">
                          <div class="itspc-status-row" style="display:flex; justify-content:space-between; font-size:13.5px; margin-bottom:8px;">
                              <span style="color:#4B5563;"><?php esc_html_e( 'Elementor Builder:', 'sekkei' ); ?></span>
                              <?php if ( did_action( 'elementor/loaded' ) ) : ?>
                                  <span style="color:#C8FF00; font-weight:600;">* <?php esc_html_e( 'Active', 'sekkei' ); ?></span>
                              <?php else : ?>
                                  <span style="color:#FF4D4D; font-weight:600;">* <?php esc_html_e( 'Inactive', 'sekkei' ); ?></span>
                              <?php endif; ?>
                          </div>
                          <div class="itspc-status-row" style="display:flex; justify-content:space-between; font-size:13.5px; margin-bottom:8px;">
                              <span style="color:#4B5563;"><?php esc_html_e( 'PHP Version:', 'sekkei' ); ?></span>
                              <span style="color:#111827;"><?php echo esc_html( phpversion() ); ?> (<?php echo version_compare( phpversion(), '7.4', '>=' ) ? 'OK' : 'No'; ?>)</span>
                          </div>
                          <div class="itspc-status-row" style="display:flex; justify-content:space-between; font-size:13.5px;">
                              <span style="color:#4B5563;"><?php esc_html_e( 'Active Theme:', 'sekkei' ); ?></span>
                              <?php $active_theme = wp_get_theme()->get( 'Name' ); ?>
                              <span style="color:#111827; font-weight:500; overflow:hidden; text-overflow:ellipsis; max-width:140px; white-space:nowrap;" title="<?php echo esc_attr( $active_theme ); ?>"><?php echo esc_html( $active_theme ); ?></span>
                          </div>
                      </div>
                  </div>

                  <!-- Card: Data Maintenance -->
                  <div class="itspc-card" style="margin-bottom: 0;">
                      <div class="itspc-card-header">
                          <div class="itspc-card-icon"></div>
                          <div class="itspc-card-title"><?php esc_html_e( 'Data Maintenance', 'sekkei' ); ?></div>
                      </div>
                      <div class="itspc-card-body" style="padding: 16px 20px;">
                          <p style="font-size:13.5px; color:#4B5563; margin-top:0; margin-bottom:12px; line-height:1.55;">
                              <?php esc_html_e( 'Having sync issues? Clear Sekkei data from this browser\'s local storage cache to start fresh.', 'sekkei' ); ?>
                          </p>
                          <button type="button" class="itspc-btn-save" id="itspc-reset-cache-btn" style="background:#FF4D4D; color:#fff; font-size:13px; padding:8px 14px; margin:0; border-radius:6px;">
                               <?php esc_html_e( 'Reset Browser Cache', 'sekkei' ); ?>
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
                <div class="itspc-card-icon"></div>
                <div class="itspc-card-title"><?php esc_html_e( 'Quick Start - 3 Steps', 'sekkei' ); ?></div>
              </div>
              <div class="itspc-card-body" style="padding:0">
                <div class="itspc-steps">
 
                  <div class="itspc-step">
                    <div class="itspc-step-num">1</div>
                    <div class="itspc-step-content">
                      <div class="itspc-step-title"><?php esc_html_e( 'Activate & Open Elementor', 'sekkei' ); ?></div>
                      <div class="itspc-step-desc"><?php esc_html_e( 'Make sure Sekkei is activated. Open any page or post in Elementor editor.', 'sekkei' ); ?></div>
                    </div>
                  </div>
 
                  <div class="itspc-step">
                    <div class="itspc-step-num">2</div>
                    <div class="itspc-step-content">
                      <div class="itspc-step-title"><?php esc_html_e( 'Launch the Panel', 'sekkei' ); ?></div>
                      <div class="itspc-step-desc">
                        <?php esc_html_e( 'Click the floating', 'sekkei' ); ?>
                        <span class="itspc-inline-badge">Sekkei</span>
                        <?php esc_html_e( 'button (bottom-right), or press', 'sekkei' ); ?>
                        <kbd class="itspc-kbd">Ctrl</kbd>+<kbd class="itspc-kbd">Shift</kbd>+<kbd class="itspc-kbd">P</kbd>
                      </div>
                    </div>
                  </div>
 
                  <div class="itspc-step" style="border-bottom:none">
                    <div class="itspc-step-num">3</div>
                    <div class="itspc-step-content">
                      <div class="itspc-step-title"><?php esc_html_e( 'Plan, Design, Ship', 'sekkei' ); ?></div>
                      <div class="itspc-step-desc"><?php esc_html_e( 'Use the 12 panels: Section Planner, Checklist, Color Palette, Font Pairs, CSS Generator, Design Tokens, Pre-Publish Audit, Project Notes, Agency Cockpit, Client Feedback, Revision Log, and SOP Templates — all saved automatically.', 'sekkei' ); ?></div>
                    </div>
                  </div>
 
                </div>
              </div>
            </div>
 
            <!-- Feature Cards -->
            <div class="itspc-card" style="margin-bottom:16px">
              <div class="itspc-card-header">
                <div class="itspc-card-icon"></div>
                <div class="itspc-card-title"><?php esc_html_e( 'Interactive Feature Guide', 'sekkei' ); ?></div>
              </div>
              <div class="itspc-card-body">
                <p style="font-size: 14px; color: #4B5563; margin-top: 0; margin-bottom: 16px;">
                  <?php esc_html_e( 'Explore each Sekkei module below. Click on any card to see a step-by-step usage guide and developer pro-tips.', 'sekkei' ); ?>
                </p>
                <div class="itspc-feature-grid">
 
                  <div class="itspc-feature-card active" data-feature="planner">
                    <div class="itspc-feature-icon"></div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Section Planner', 'sekkei' ); ?></div>
                  </div>
 
                  <div class="itspc-feature-card" data-feature="checklist">
                    <div class="itspc-feature-icon"></div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Design Checklist', 'sekkei' ); ?></div>
                  </div>
 
                  <div class="itspc-feature-card" data-feature="palette">
                    <div class="itspc-feature-icon"></div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Color Palette', 'sekkei' ); ?></div>
                  </div>
 
                  <div class="itspc-feature-card" data-feature="fonts">
                    <div class="itspc-feature-icon"></div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Font Pairing', 'sekkei' ); ?></div>
                  </div>
 
                  <div class="itspc-feature-card" data-feature="css">
                    <div class="itspc-feature-icon"></div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'CSS Generator', 'sekkei' ); ?></div>
                  </div>
 
                  <div class="itspc-feature-card" data-feature="notes">
                    <div class="itspc-feature-icon"></div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Project Notes', 'sekkei' ); ?></div>
                  </div>
 
                  <div class="itspc-feature-card" data-feature="audit">
                    <div class="itspc-feature-icon"></div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Pre-Publish Audit', 'sekkei' ); ?></div>
                  </div>

                  <div class="itspc-feature-card" data-feature="tokens">
                    <div class="itspc-feature-icon"></div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Design Tokens', 'sekkei' ); ?></div>
                  </div>

                  <div class="itspc-feature-card" data-feature="cockpit">
                    <div class="itspc-feature-icon"></div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Agency Cockpit', 'sekkei' ); ?></div>
                  </div>

                  <div class="itspc-feature-card" data-feature="feedback">
                    <div class="itspc-feature-icon"></div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Client Feedback', 'sekkei' ); ?></div>
                  </div>

                  <div class="itspc-feature-card" data-feature="revisions">
                    <div class="itspc-feature-icon"></div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'Revision Log', 'sekkei' ); ?></div>
                  </div>

                  <div class="itspc-feature-card" data-feature="sop">
                    <div class="itspc-feature-icon"></div>
                    <div class="itspc-feature-name"><?php esc_html_e( 'SOP Templates', 'sekkei' ); ?></div>
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
                <div class="itspc-card-icon"></div>
                <div class="itspc-card-title"><?php esc_html_e( 'Frequently Asked Questions', 'sekkei' ); ?></div>
              </div>
              <div class="itspc-card-body" style="padding:0">
                <div class="itspc-accordion">
 
                  <div class="itspc-accordion-item">
                    <button class="itspc-accordion-btn" type="button">
                      <span><?php esc_html_e( 'Does Sekkei require Elementor Pro?', 'sekkei' ); ?></span>
                      <span class="itspc-accordion-arrow">v</span>
                    </button>
                    <div class="itspc-accordion-body">
                      <p><?php esc_html_e( 'No. Sekkei works with the free version of Elementor. No Pro license needed.', 'sekkei' ); ?></p>
                    </div>
                  </div>
 
                  <div class="itspc-accordion-item">
                    <button class="itspc-accordion-btn" type="button">
                      <span><?php esc_html_e( 'Where is my data stored?', 'sekkei' ); ?></span>
                      <span class="itspc-accordion-arrow">v</span>
                    </button>
                    <div class="itspc-accordion-body">
                      <p><?php esc_html_e( 'All your project data (sections, colors, notes, etc.) is stored in your browser\'s localStorage. It stays on your device and is never sent to any server. Use the Export -> JSON feature to back it up.', 'sekkei' ); ?></p>
                    </div>
                  </div>
 
                  <div class="itspc-accordion-item">
                    <button class="itspc-accordion-btn" type="button">
                      <span><?php esc_html_e( 'Will it slow down my website?', 'sekkei' ); ?></span>
                      <span class="itspc-accordion-arrow">v</span>
                    </button>
                    <div class="itspc-accordion-body">
                      <p><?php esc_html_e( 'Sekkei only loads its scripts inside the Elementor editor - never on your frontend. Your site\'s load time is completely unaffected.', 'sekkei' ); ?></p>
                    </div>
                  </div>
 
                  <div class="itspc-accordion-item">
                    <button class="itspc-accordion-btn" type="button">
                      <span><?php esc_html_e( 'Can I use it for multiple client projects?', 'sekkei' ); ?></span>
                      <span class="itspc-accordion-arrow">v</span>
                    </button>
                    <div class="itspc-accordion-body">
                      <p><?php esc_html_e( 'Yes. Use the Projects feature inside the tool to create separate workspaces for each client. Each project has its own sections, colors, palette, and notes.', 'sekkei' ); ?></p>
                    </div>
                  </div>
 
                  <div class="itspc-accordion-item" style="border-bottom:none">
                    <button class="itspc-accordion-btn" type="button">
                      <span><?php esc_html_e( 'How do I back up or move my data?', 'sekkei' ); ?></span>
                      <span class="itspc-accordion-arrow">v</span>
                    </button>
                    <div class="itspc-accordion-body">
                      <p><?php esc_html_e( 'Open the tool -> go to the Export tab -> click "Download JSON". This saves all your projects. To restore, click "Import JSON" on any browser/device.', 'sekkei' ); ?></p>
                    </div>
                  </div>
 
                </div>
              </div>
            </div>
 
            <!-- Keyboard Shortcuts -->
            <div class="itspc-card">
              <div class="itspc-card-header">
                <div class="itspc-card-icon"></div>
                <div class="itspc-card-title"><?php esc_html_e( 'Keyboard Shortcuts', 'sekkei' ); ?></div>
              </div>
              <div class="itspc-card-body" style="padding:0">
                <div class="itspc-shortcut-list" style="border:none;border-radius:0;background:transparent;padding:0 24px">
                  <div class="itspc-shortcut-item">
                    <span><?php esc_html_e( 'Toggle Panel (Show / Hide)', 'sekkei' ); ?></span>
                    <span class="itspc-shortcut-keys"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd></span>
                  </div>
                  <div class="itspc-shortcut-item">
                    <span><?php esc_html_e( 'Close Panel', 'sekkei' ); ?></span>
                    <span class="itspc-shortcut-keys"><kbd>Esc</kbd></span>
                  </div>
                  <div class="itspc-shortcut-item" style="border-bottom:none">
                    <span><?php esc_html_e( 'Navigate Tabs (inside tool)', 'sekkei' ); ?></span>
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
                      <div class="itspc-card-icon"></div>
                      <div class="itspc-card-title"><?php esc_html_e( 'About the Developer', 'sekkei' ); ?></div>
                  </div>
                  <div class="itspc-card-body">
                      <div class="itspc-about-grid">
                          <div class="itspc-about-text">
                              <div class="itspc-about-logo">Sek<span>kei</span></div>
                              <p style="margin-top: 12px; font-size: 14px; color: #6B7280; font-weight: 500;"><?php esc_html_e( 'Built by itsmanzur', 'sekkei' ); ?></p>
                              <p><?php esc_html_e( 'I\'m an independent WordPress developer building modern workflow tools to speed up your web development process. Sekkei was born out of the need to eliminate browser-tab clutter and app-switching fatigue while planning and structuring Elementor layouts.', 'sekkei' ); ?></p>
                              <p><?php esc_html_e( 'If Sekkei helps you design better websites faster, please consider leaving a review on WordPress.org to support the ongoing development of this 100% free plugin!', 'sekkei' ); ?></p>
                              
                              <div style="margin-top: 24px; display: flex; gap: 20px;">
                                  <a href="https://profiles.wordpress.org/itsmanzur/" target="_blank" rel="noopener noreferrer" class="itspc-link-btn"> <?php esc_html_e( 'Profile', 'sekkei' ); ?></a>
                                  <a href="https://wordpress.org/support/plugin/sekkei/" target="_blank" rel="noopener noreferrer" class="itspc-link-btn"> <?php esc_html_e( 'Get Support', 'sekkei' ); ?></a>
                                  <a href="https://wordpress.org/support/plugin/sekkei/reviews/" target="_blank" rel="noopener noreferrer" class="itspc-link-btn"> <?php esc_html_e( 'Rate & Review', 'sekkei' ); ?></a>
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
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'You do not have sufficient permissions.', 'sekkei' ) );
        }

        $tool_args = array(
            'v' => ITSPC_VERSION,
        );
        if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
            $tool_args['debug'] = '1';
        }

        $tool_url = esc_url( add_query_arg( $tool_args, ITSPC_PLUGIN_URI . '/assets/tool/index.html' ) );
        ?>

        <a href="<?php echo esc_url( admin_url( 'admin.php?page=sekkei' ) ); ?>" class="itspc-back-link">
            <- <?php esc_html_e( 'Back to Dashboard', 'sekkei' ); ?>
        </a>
        <iframe
            src="<?php echo esc_url( $tool_url ); ?>"
            style="width:100%;height:100vh;border:none;display:block;"
            title="<?php esc_attr_e( 'Sekkei Tool', 'sekkei' ); ?>"
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
                    ? sprintf( /* translators: %s: Agency name */ __( 'Welcome from %s', 'sekkei' ), esc_html( $settings['welcome_widget_agency'] ) )
                    : __( 'Client Support & Resources', 'sekkei' ),
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
        return '<div class="itspc-video-fallback"><a href="' . esc_url( $url ) . '" target="_blank" rel="noopener noreferrer" class="button button-secondary"><span class="dashicons dashicons-video-alt3" style="vertical-align: middle; margin-right: 5px;"></span>' . esc_html__( 'Watch Video Tutorial', 'sekkei' ) . '</a></div>';
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

        $agency_name = ! empty( $settings['welcome_widget_agency'] ) ? $settings['welcome_widget_agency'] : __( 'Acme Agency', 'sekkei' );
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
                    <div class="itspc-widget-logo-placeholder"></div>
                <?php endif; ?>
                <div class="itspc-widget-title-wrap">
                    <h4 class="itspc-widget-agency-name"><?php echo esc_html( $agency_name ); ?></h4>
                    <span class="itspc-widget-badge"><?php esc_html_e( 'Website Partner', 'sekkei' ); ?></span>
                </div>
            </div>

            <?php if ( ! empty( $msg ) ) : ?>
                <div class="itspc-widget-msg">
                    <?php echo wp_kses_post( nl2br( $msg ) ); ?>
                </div>
            <?php else : ?>
                <div class="itspc-widget-msg">
                    <?php esc_html_e( 'Welcome to your site administration dashboard! If you need support or updates, feel free to contact us anytime.', 'sekkei' ); ?>
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
                            <?php esc_html_e( 'Support Email:', 'sekkei' ); ?>
                            <a href="mailto:<?php echo esc_attr( $email ); ?>" class="itspc-widget-email-link"><?php echo esc_html( $email ); ?></a>
                        </span>
                    </div>
                    <a href="mailto:<?php echo esc_attr( $email ); ?>" class="itspc-support-btn">
                        <?php esc_html_e( 'Request Support', 'sekkei' ); ?>
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
     * - itspc-admin.css on all plugin pages and on the dashboard when the widget is active.
     * - itspc-admin.js (tab switching, accordion, cache reset) on plugin pages.
     * - itspc-tool-page.css only on the sekkei-tool sub-page.
     *
     * @param string $hook Current admin page hook suffix.
     */
    public function enqueue_admin_scripts( $hook ) {
        $is_sekkei = false !== strpos( $hook, 'sekkei' );
        $is_dashboard = 'index.php' === $hook;

        $debug = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;
        $suffix = $debug ? '' : '.min';

        // Load CSS on the WP dashboard when the welcome widget is active.
        if ( $is_dashboard ) {
            $settings = get_option( 'itspc_settings', array() );
            if ( ! empty( $settings['show_welcome_widget'] ) ) {
                wp_enqueue_style(
                    'itspc-admin',
                    ITSPC_PLUGIN_URI . '/assets/css/itspc-admin' . $suffix . '.css',
                    array(),
                    ITSPC_VERSION
                );
            }
        }

        // Everything below is for plugin pages only.
        if ( ! $is_sekkei ) {
            return;
        }

        wp_enqueue_style(
            'itspc-admin',
            ITSPC_PLUGIN_URI . '/assets/css/itspc-admin' . $suffix . '.css',
            array(),
            ITSPC_VERSION
        );

        wp_enqueue_script(
            'itspc-admin',
            ITSPC_PLUGIN_URI . '/assets/js/itspc-admin' . $suffix . '.js',
            array(),
            ITSPC_VERSION,
            true
        );

        wp_localize_script(
            'itspc-admin',
            'itspcAdminData',
            array(
                'ajaxUrl'      => admin_url( 'admin-ajax.php' ),
                'ajaxNonce'    => wp_create_nonce( 'itspc-ajax-nonce' ),
                'confirmReset' => __( 'Are you sure you want to reset all Sekkei tool data? This will permanently delete all planner structures, palettes, and checklists from this browser.', 'sekkei' ),
                'resetSuccess' => __( 'All browser cached data for Sekkei has been successfully cleared.', 'sekkei' ),
            )
        );

        // Tool page: fullscreen CSS override (hides admin bar, sidebar, footer).
        if ( false !== strpos( $hook, 'sekkei-tool' ) ) {
            wp_enqueue_style(
                'itspc-tool-page',
                ITSPC_PLUGIN_URI . '/assets/css/itspc-tool-page' . $suffix . '.css',
                array( 'itspc-admin' ),
                ITSPC_VERSION
            );
        }
    }

    /**
     * Save the backup data to wp_usermeta.
     */
    public function ajax_save_backup() {
        check_ajax_referer( 'itspc-ajax-nonce', 'nonce' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => __( 'Insufficient permissions.', 'sekkei' ) ) );
        }

        $data = isset( $_POST['data'] ) ? wp_unslash( $_POST['data'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- raw JSON string is validated/sanitized inside the parser or normalized before use.
        if ( empty( $data ) ) {
            wp_send_json_error( array( 'message' => __( 'No data provided.', 'sekkei' ) ) );
        }

        // Limit size of backup (max 3MB string)
        if ( strlen( $data ) > 3 * 1024 * 1024 ) {
            wp_send_json_error( array( 'message' => __( 'Data size exceeds 3MB limit.', 'sekkei' ) ) );
        }

        // Quick JSON validate
        $parsed = json_decode( $data, true );
        if ( null === $parsed ) {
            wp_send_json_error( array( 'message' => __( 'Invalid JSON data.', 'sekkei' ) ) );
        }

        $user_id = get_current_user_id();
        update_user_meta( $user_id, 'itspc_data_backup', $data );

        wp_send_json_success( array(
            'message'   => __( 'Backup saved to database.', 'sekkei' ),
            'timestamp' => current_time( 'mysql' )
        ) );
    }

    /**
     * Load the backup data from wp_usermeta.
     */
    public function ajax_load_backup() {
        check_ajax_referer( 'itspc-ajax-nonce', 'nonce' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => __( 'Insufficient permissions.', 'sekkei' ) ) );
        }

        $user_id = get_current_user_id();
        $data = get_user_meta( $user_id, 'itspc_data_backup', true );

        if ( empty( $data ) ) {
            wp_send_json_error( array( 'message' => __( 'No database backup found.', 'sekkei' ) ) );
        }

        wp_send_json_success( array(
            'data' => json_decode( $data, true )
        ) );
    }

    /**
     * Sync Sekkei Colors and Fonts directly to Elementor Kit database options.
     */
    public function ajax_sync_elementor_globals() {
        check_ajax_referer( 'itspc-ajax-nonce', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( 'Unauthorized' );
        }

        $colors_data = isset( $_POST['colors'] ) ? wp_unslash( $_POST['colors'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
        $fonts_data  = isset( $_POST['fonts'] ) ? wp_unslash( $_POST['fonts'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

        $kit_id = get_option( 'elementor_active_kit' );
        if ( ! $kit_id ) {
            wp_send_json_error( array( 'message' => __( 'Active Elementor Kit not found. Make sure Elementor is installed and configured.', 'sekkei' ) ) );
        }

        $page_settings = get_post_meta( $kit_id, '_elementor_page_settings', true );
        if ( ! is_array( $page_settings ) ) {
            $page_settings = array();
        }

        $updated = false;

        // Process Colors
        if ( ! empty( $colors_data ) ) {
            $colors = json_decode( $colors_data, true );
            if ( is_array( $colors ) ) {
                $system_colors = array();
                $custom_colors = array();
                $system_roles  = array( 'primary', 'secondary', 'text', 'accent' );
                $role_map      = array();

                foreach ( $colors as $c ) {
                    if ( isset( $c['role'] ) && in_array( $c['role'], $system_roles, true ) ) {
                        $role_map[ $c['role'] ] = $c['hex'];
                    }
                }

                $system_index = 0;
                foreach ( $colors as $c ) {
                    if ( ! isset( $c['role'] ) || ! in_array( $c['role'], $system_roles, true ) ) {
                        while ( $system_index < count( $system_roles ) ) {
                            $r = $system_roles[ $system_index ];
                            if ( ! isset( $role_map[ $r ] ) ) {
                                $role_map[ $r ] = $c['hex'];
                                $system_index++;
                                break;
                            }
                            $system_index++;
                        }
                    }
                }

                $defaults = array(
                    'primary'   => '#6EC1E4',
                    'secondary' => '#54595F',
                    'text'      => '#7A7A7A',
                    'accent'    => '#61CE70',
                );

                foreach ( $system_roles as $r ) {
                    $system_colors[] = array(
                        '_id'   => $r,
                        'title' => ucfirst( $r ),
                        'color' => isset( $role_map[ $r ] ) ? $role_map[ $r ] : $defaults[ $r ],
                    );
                }

                foreach ( $colors as $c ) {
                    $is_mapped_system = false;
                    foreach ( $role_map as $r => $hex ) {
                        if ( $hex === $c['hex'] ) {
                            $is_mapped_system = true;
                            break;
                        }
                    }
                    if ( ! $is_mapped_system || ( isset( $c['role'] ) && ! in_array( $c['role'], $system_roles, true ) ) ) {
                        $custom_colors[] = array(
                            '_id'   => isset( $c['id'] ) ? $c['id'] : 'color_' . substr( md5( uniqid( rand(), true ) ), 0, 9 ),
                            'title' => isset( $c['name'] ) ? $c['name'] : 'Custom Color',
                            'color' => $c['hex'],
                        );
                    }
                }

                $page_settings['system_colors'] = $system_colors;
                $page_settings['custom_colors'] = $custom_colors;
                $updated = true;
            }
        }

        // Process Fonts
        if ( ! empty( $fonts_data ) ) {
            $fonts = json_decode( $fonts_data, true );
            if ( is_array( $fonts ) && isset( $fonts['heading'] ) && isset( $fonts['body'] ) ) {
                $heading = sanitize_text_field( $fonts['heading'] );
                $body    = sanitize_text_field( $fonts['body'] );

                $system_typography = array(
                    array(
                        '_id'                    => 'primary',
                        'title'                  => 'Primary',
                        'typography_font_family' => $heading,
                        'typography_font_weight' => '700',
                    ),
                    array(
                        '_id'                    => 'secondary',
                        'title'                  => 'Secondary',
                        'typography_font_family' => $heading,
                        'typography_font_weight' => '600',
                    ),
                    array(
                        '_id'                    => 'text',
                        'title'                  => 'Text',
                        'typography_font_family' => $body,
                        'typography_font_weight' => '400',
                    ),
                    array(
                        '_id'                    => 'accent',
                        'title'                  => 'Accent',
                        'typography_font_family' => $heading,
                        'typography_font_weight' => '500',
                    ),
                );

                $page_settings['system_typography'] = $system_typography;
                $updated = true;
            }
        }

        if ( $updated ) {
            update_post_meta( $kit_id, '_elementor_page_settings', $page_settings );

            // Clear Elementor CSS Cache
            if ( class_exists( '\Elementor\Plugin' ) ) {
                \Elementor\Plugin::$instance->files_manager->clear_cache();
            }

            wp_send_json_success( array( 'message' => __( 'Elementor global styles successfully synced to database.', 'sekkei' ) ) );
        }

        wp_send_json_error( array( 'message' => __( 'No valid styling data updated.', 'sekkei' ) ) );
    }
}

