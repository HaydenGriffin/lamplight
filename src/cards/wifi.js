/* Wi-Fi: a big scannable code for guests. The password lives only inside the QR image, never in the config or the page.
 *   type: custom:lamplight-wifi-card
 *   qr: /local/guest/wifi.svg       # a QR code for WIFI:T:WPA;S:<ssid>;P:<password>;;
 *   ssid: Guest network
 */
class LamplightWifiCard extends LamplightCard {
  setConfig(config) {
    if (!config.qr) throw new Error('qr is required');
    super.setConfig(config);
  }

  build() {
    this.built = true;
    const { qr, ssid } = this.config;
    this.shell('Wi-Fi', `<main>
        <div class="code"><img src="${esc(qr)}" alt="Wi-Fi QR code"></div>
        <div class="info">
          <div class="disc on"><ha-icon icon="mdi:wifi"></ha-icon></div>
          ${ssid ? `<p class="label">Network</p><p class="ssid">${esc(ssid)}</p>` : ''}
          <ol><li>Open your phone's camera</li><li>Point it at the code</li><li>Tap <b>Join</b></li></ol>
        </div></main>`, { sub: this.config.subtitle || 'For guests and new devices' });
  }

  styles() {
    return `
      main{flex:1;min-height:0;display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center}
      .code{height:100%;max-height:390px;aspect-ratio:1;background:#fff;border-radius:26px;padding:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 40px rgba(var(--warm-rgb),.18)}
      .code img{width:100%;height:100%;display:block;image-rendering:pixelated}
      .info{background:var(--panel);border-radius:var(--r-tile);padding:20px 22px;align-self:stretch;display:flex;flex-direction:column;justify-content:center;gap:4px}
      .disc.on{width:56px;height:56px;background:var(--warm);color:var(--warm-ink);box-shadow:0 0 22px var(--warm-glow);margin-bottom:10px} .disc.on ha-icon{--mdc-icon-size:30px}
      .label{margin:0;font-size:17px;color:var(--muted)}
      .ssid{margin:0 0 14px;font-size:30px;font-weight:600;word-break:break-all}
      ol{margin:0;padding-left:26px;font-size:19px;line-height:1.6} ol b{color:var(--warm)}`;
  }
}
define('lamplight-wifi-card', LamplightWifiCard, 'Lamplight Wi-Fi', 'A guest Wi-Fi QR code, big enough to scan from the sofa.');
