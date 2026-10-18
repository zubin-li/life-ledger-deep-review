/* Native traffic lights remain OS-owned. This module only owns the surrounding surface
   and a device-local visual profile, never authentication or synced account records. */
(() => {
  const KEY = 'life-ledger-device-profile';
  let context, profile = {}, upload = 0;
  const $ = s => document.querySelector(s);
  const validAvatar = value => typeof value === 'string' && value.length <= 150000 && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
  function load() {
    try { profile = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { profile = {}; }
    profile = { name: String(profile.name || '').slice(0,60), avatar: validAvatar(profile.avatar) ? profile.avatar : '' };
  }
  function persist(next) {
    try { localStorage.setItem(KEY, JSON.stringify(next)); profile = next; refresh(); return true; }
    catch { $('#profileFeedback').textContent = context.text('无法保存，请检查设备存储空间。','Could not save. Check device storage.','Speichern fehlgeschlagen. Gerätespeicher prüfen.'); return false; }
  }
  function refresh() {
    if (!context) return;
    const t = context.text;
    const labels = {
      profileHeading:t('你的空间','Your space','Dein Bereich'),
      profileChoosePhoto:t('选择头像','Choose photo','Bild auswählen'),
      profileRemovePhoto:t('移除','Remove','Entfernen'),
      profileNameLabel:t('显示名称','Display name','Anzeigename'),
      profileDeviceNote:t('头像与名称仅保存在此设备，不修改登录账户或同步记录。PNG、JPEG 或 WebP，最大 5 MB。','Name and photo stay on this device; they do not change your sign-in or synced records. PNG, JPEG or WebP, up to 5 MB.','Name und Bild bleiben auf diesem Gerät. Anmeldung und synchronisierte Einträge bleiben unverändert. PNG, JPEG oder WebP, bis 5 MB.')
    };
    Object.entries(labels).forEach(([id,text]) => { $('#'+id).textContent = text; });
    $('#sidebarProfileName').textContent = profile.name || t('我的空间','My space','Mein Bereich');
    $('#sidebarAccount').setAttribute('aria-label',t('个人外观与设置','Personal appearance and settings','Persönliches Erscheinungsbild und Einstellungen'));
    $('#sidebarAccount').title = `${$('#sidebarProfileName').textContent} · ${t('设置','Settings','Einstellungen')}`;
    if (document.activeElement !== $('#profileDisplayName')) $('#profileDisplayName').value = profile.name;
    $('#profileRemovePhoto').hidden = !profile.avatar;
    for (const id of ['sidebarAvatar','settingsAvatar']) {
      const node = $('#'+id); node.replaceChildren();
      if (profile.avatar) { const img = new Image(); img.src = profile.avatar; img.alt = ''; node.append(img); }
      else node.textContent = Array.from(profile.name.trim() || 'L')[0].toLocaleUpperCase();
    }
    setMode($('#saveMode span')?.textContent || '');
  }
  function setMode(text) {
    if (!context) return;
    const label = document.documentElement.dataset.desktop === 'tauri-cloud'
      ? context.text('连接工作区','Connected workspace','Verbundener Bereich')
      : context.text('本机工作区','Local workspace','Lokaler Bereich');
    $('#windowbarMode').textContent = label;
    $('#sidebarProfileMode').textContent = label;
    $('#sidebarProfileMode').title = text;
  }
  async function photo(file) {
    const current = ++upload, t = context.text;
    const feedback = $('#profileFeedback'); feedback.textContent = '';
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 5*1024*1024) {
      feedback.textContent = t('请选择不超过 5 MB 的 PNG、JPEG 或 WebP 图片。','Choose a PNG, JPEG or WebP image up to 5 MB.','Bitte PNG, JPEG oder WebP bis 5 MB auswählen.'); return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image(); img.src = url; await img.decode();
      if (current !== upload) return;
      if (img.naturalWidth*img.naturalHeight > 25000000) throw new Error('image too large');
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 192;
      const ctx = canvas.getContext('2d'), side = Math.min(img.naturalWidth,img.naturalHeight);
      ctx.fillStyle = '#e4edf4'; ctx.fillRect(0,0,192,192);
      ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,192,192);
      const avatar = canvas.toDataURL('image/jpeg',.85);
      if (!validAvatar(avatar)) throw new Error('invalid image');
      persist({...profile,avatar});
    } catch {
      if (current === upload) feedback.textContent = t('图片无法读取，原头像已保留。请换一张较小的图片。','Could not read this image. Your previous photo is unchanged. Try a smaller image.','Bild nicht lesbar. Das bisherige Bild bleibt erhalten. Bitte ein kleineres Bild wählen.');
    } finally { URL.revokeObjectURL(url); $('#profilePhotoFile').value = ''; }
  }
  function init(options) {
    context = options; load();
    $('#mobileSettingsButton').replaceChildren($('#openSettingsButton svg').cloneNode(true));
    if (document.documentElement.hasAttribute('data-desktop')) {
      $('#windowSidebarControl').append($('#sidebarToggle'));
      if (new URLSearchParams(location.search).get('settings') === '1') $('#desktopWindowbar').classList.add('is-settings-window');
    }
    $('#sidebarAccount').addEventListener('click',()=>context.openSettings());
    $('#profileDisplayName').addEventListener('input',e=>{persist({...profile,name:e.target.value.trim().slice(0,60)});});
    $('#profileChoosePhoto').addEventListener('click',()=>$('#profilePhotoFile').click());
    $('#profilePhotoFile').addEventListener('change',e=>void photo(e.target.files[0]));
    $('#profileRemovePhoto').addEventListener('click',()=>{++upload;persist({...profile,avatar:''});});
    window.addEventListener('storage',e=>{if(e.key === KEY || e.key === null) {load();refresh();}});
    refresh();
  }
  window.LifeLedgerWindowShell = {init,refresh,setMode};
})();
