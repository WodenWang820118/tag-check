/**
 * GA4 collection requests recorded from the official gtag.js
 * (https://www.googletagmanager.com/gtag/js, build `gtm=45je6ae1za200xf1`) in
 * Chrome 148 on 2026-10-19, using the event payloads from Google's recommended
 * events reference. The page URL was `/shop/item?a=1&b=two%20words#reviews` and
 * its title `Shoes & Bags #1`, so `dl` and `dt` carry characters that must
 * stay encoded. Google does not publish this wire format; these recordings are
 * the ground truth the parsers are tested against.
 */
export interface RecordedCollectRequest {
  url: string;
  body: string;
}

/** Official add_to_cart example with every documented item parameter, plus a custom
 * item parameter holding characters gtag.js has to escape (`&`, `#`, `+`, `%`, `~`, CJK). */
export const GTAG_ADD_TO_CART_HIT: RecordedCollectRequest = {
  url: 'https://www.google-analytics.com/g/collect?v=2&tid=G-TAGCHECK01&gtm=45je6ae1za200xf1&_p=1792387920252&gcd=13l3l3l3l1l1&npa=0&dma=0&are=1&cid=1809749667.1792387922&frm=0&pscdl=noapi&rcb=17&sr=800x600&uaa=x86&uab=64&uafvl=Not%252FA)Brand%3B99.0.0.0%7CChromium%3B148.0.7778.97&uam=&uamb=0&uap=Windows&uapv=19.0.0&uaw=0&ul=zh-tw&_s=1&tag_exp=115938465~115938468~118897920~118897930~120385423~120469145~120469153~121246026~121246034&cu=USD&sid=1792387921&sct=1&seg=0&dl=http%3A%2F%2F127.0.0.1%2Fshop%2Fitem%3Fa%3D1%26b%3Dtwo%2520words&dt=Shoes%20%26%20Bags%20%231&en=add_to_cart&_fv=1&_nsi=1&_ss=1&_ee=1&pr1=idSKU_12345~nmStan%20and%20Friends%20Tee~afGoogle%20Merchandise%20Store~cpSUMMER_FUN~ds2.22~lp0~brGoogle~caApparel~c2Adult~c3Shirts~c4Crew~c5Short%20sleeve~lirelated_products~lnRelated%20Products~vagreen~loChIJIQBpAG2ahYAR_6128GcTUEo~pr10.01~qt3~k0in_stock~v0yes%20%26%20%231%20%3D%20C%2B%2B%2050%25%20~~tilde%20%E5%8F%B0%E5%8C%97&epn.value=30.03&tfd=1686',
  body: ''
};

/** Official purchase example: transaction-level parameters travel as `ep.` / `epn.`. */
export const GTAG_PURCHASE_HIT: RecordedCollectRequest = {
  url: 'https://www.google-analytics.com/g/collect?v=2&tid=G-TAGCHECK01&gtm=45je6ae1za200xf1&_p=1792387920252&gcd=13l3l3l3l1l1&npa=0&dma=0&_eu=AAAAAAQ&are=1&cid=1809749667.1792387922&frm=0&pscdl=noapi&rcb=17&sr=800x600&uaa=x86&uab=64&uafvl=Not%252FA)Brand%3B99.0.0.0%7CChromium%3B148.0.7778.97&uam=&uamb=0&uap=Windows&uapv=19.0.0&uaw=0&ul=zh-tw&_s=2&tag_exp=115938465~115938468~118897920~118897930~120385423~120469145~120469153~121246026~121246034&cu=USD&sid=1792387921&sct=1&seg=0&dl=http%3A%2F%2F127.0.0.1%2Fshop%2Fitem%3Fa%3D1%26b%3Dtwo%2520words&dt=Shoes%20%26%20Bags%20%231&en=purchase&_ee=1&pr1=idSKU_12345~nmStan%20and%20Friends%20Tee~afGoogle%20Merchandise%20Store~cpSUMMER_FUN~ds2.22~lp0~brGoogle~caApparel~c2Adult~c3Shirts~c4Crew~c5Short%20sleeve~lirelated_products~lnRelated%20Products~vagreen~loChIJIQBpAG2ahYAR_6128GcTUEo~pr10.01~qt3&ep.transaction_id=T_12345&epn.value=72.05&epn.tax=3.6&epn.shipping=5.99&ep.coupon=SUMMER_SALE&ep.customer_type=new&_et=6012&tfd=12709',
  body: ''
};

/** Official view_promotion example with promotion fields at event and item level. */
export const GTAG_VIEW_PROMOTION_HIT: RecordedCollectRequest = {
  url: 'https://www.google-analytics.com/g/collect?v=2&tid=G-TAGCHECK01&gtm=45je6ae1za200xf1&_p=1792387920252&gcd=13l3l3l3l1l1&npa=0&dma=0&_eu=AAAAAAQ&are=1&cid=1809749667.1792387922&frm=0&pscdl=noapi&rcb=17&sr=800x600&uaa=x86&uab=64&uafvl=Not%252FA)Brand%3B99.0.0.0%7CChromium%3B148.0.7778.97&uam=&uamb=0&uap=Windows&uapv=19.0.0&uaw=0&ul=zh-tw&_s=3&tag_exp=115938465~115938468~118897920~118897930~120385423~120469145~120469153~121246026~121246034&sid=1792387921&sct=1&seg=1&dl=http%3A%2F%2F127.0.0.1%2Fshop%2Fitem%3Fa%3D1%26b%3Dtwo%2520words&dt=Shoes%20%26%20Bags%20%231&en=view_promotion&_ee=1&pr1=idSKU_12345~nmStan%20and%20Friends%20Tee~afGoogle%20Merchandise%20Store~cpSUMMER_FUN~ds2.22~lp0~brGoogle~caApparel~c2Adult~c3Shirts~c4Crew~c5Short%20sleeve~lirelated_products~lnRelated%20Products~vagreen~loChIJIQBpAG2ahYAR_6128GcTUEo~pr10.01~qt3~cnsummer_banner2~csfeatured_app_1~piP_12345~pnSummer%20Sale&ep.creative_name=Summer%20Banner&ep.creative_slot=featured_app_1&ep.promotion_id=P_12345&ep.promotion_name=Summer%20Sale&_et=6017&tfd=18721',
  body: ''
};

/** select_content, login and search sent in the same tick: gtag.js batches them into one
 * request with the shared parameters in the URL and one event per body line. */
export const GTAG_BATCHED_HIT: RecordedCollectRequest = {
  url: 'https://www.google-analytics.com/g/collect?v=2&tid=G-TAGCHECK01&gtm=45je6ae1za200xf1&_p=1792387920252&gcd=13l3l3l3l1l1&npa=0&dma=0&_eu=AAAAAAQ&are=1&cid=1809749667.1792387922&frm=0&pscdl=noapi&rcb=17&sr=800x600&uaa=x86&uab=64&uafvl=Not%252FA)Brand%3B99.0.0.0%7CChromium%3B148.0.7778.97&uam=&uamb=0&uap=Windows&uapv=19.0.0&uaw=0&ul=zh-tw&tag_exp=115938465~115938468~118897920~118897930~120385423~120469145~120469153~121246026~121246034&sid=1792387921&sct=1&seg=1&dl=http%3A%2F%2F127.0.0.1%2Fshop%2Fitem%3Fa%3D1%26b%3Dtwo%2520words&dt=Shoes%20%26%20Bags%20%231&_s=4&tfd=24736',
  body: 'en=select_content&_ee=1&ep.content_type=product&ep.content_id=C1&_et=6006\r\nen=login&_ee=1&ep.method=Google&_et=1\r\nen=search&_ee=1&ep.search_term=a%26b%20%23c%20%2Bd&_et=1'
};

/** view_item_list with six items: once the URL would pass ~2,000 characters gtag.js moves
 * the single event into the POST body, so `en` is not in the URL. */
export const GTAG_LONG_VIEW_ITEM_LIST_HIT: RecordedCollectRequest = {
  url: 'https://www.google-analytics.com/g/collect?v=2&tid=G-TAGCHECK01&gtm=45je6ae1za200xf1&_p=1792387920252&gcd=13l3l3l3l1l1&npa=0&dma=0&_eu=AAAAAAQ&are=1&cid=1809749667.1792387922&frm=0&pscdl=noapi&rcb=17&sr=800x600&uaa=x86&uab=64&uafvl=Not%252FA)Brand%3B99.0.0.0%7CChromium%3B148.0.7778.97&uam=&uamb=0&uap=Windows&uapv=19.0.0&uaw=0&ul=zh-tw&_s=6&tag_exp=115938465~115938468~118897920~118897930~120385423~120469145~120469153~121246026~121246034&sid=1792387921&sct=1&seg=1&dl=http%3A%2F%2F127.0.0.1%2Fshop%2Fitem%3Fa%3D1%26b%3Dtwo%2520words&dt=Shoes%20%26%20Bags%20%231&tfd=36770',
  body: 'en=view_item_list&_ee=1&pr1=idSKU_0~nmStan%20and%20Friends%20Tee~afGoogle%20Merchandise%20Store~cpSUMMER_FUN~ds2.22~lp0~brGoogle~caApparel~c2Adult~c3Shirts~c4Crew~c5Short%20sleeve~lirelated_products~lnRelated%20Products~vagreen~loChIJIQBpAG2ahYAR_6128GcTUEo~pr10.01~qt3&pr2=idSKU_1~nmStan%20and%20Friends%20Tee~afGoogle%20Merchandise%20Store~cpSUMMER_FUN~ds2.22~lp1~brGoogle~caApparel~c2Adult~c3Shirts~c4Crew~c5Short%20sleeve~lirelated_products~lnRelated%20Products~vagreen~loChIJIQBpAG2ahYAR_6128GcTUEo~pr10.01~qt3&pr3=idSKU_2~nmStan%20and%20Friends%20Tee~afGoogle%20Merchandise%20Store~cpSUMMER_FUN~ds2.22~lp2~brGoogle~caApparel~c2Adult~c3Shirts~c4Crew~c5Short%20sleeve~lirelated_products~lnRelated%20Products~vagreen~loChIJIQBpAG2ahYAR_6128GcTUEo~pr10.01~qt3&pr4=idSKU_3~nmStan%20and%20Friends%20Tee~afGoogle%20Merchandise%20Store~cpSUMMER_FUN~ds2.22~lp3~brGoogle~caApparel~c2Adult~c3Shirts~c4Crew~c5Short%20sleeve~lirelated_products~lnRelated%20Products~vagreen~loChIJIQBpAG2ahYAR_6128GcTUEo~pr10.01~qt3&pr5=idSKU_4~nmStan%20and%20Friends%20Tee~afGoogle%20Merchandise%20Store~cpSUMMER_FUN~ds2.22~lp4~brGoogle~caApparel~c2Adult~c3Shirts~c4Crew~c5Short%20sleeve~lirelated_products~lnRelated%20Products~vagreen~loChIJIQBpAG2ahYAR_6128GcTUEo~pr10.01~qt3&pr6=idSKU_5~nmStan%20and%20Friends%20Tee~afGoogle%20Merchandise%20Store~cpSUMMER_FUN~ds2.22~lp5~brGoogle~caApparel~c2Adult~c3Shirts~c4Crew~c5Short%20sleeve~lirelated_products~lnRelated%20Products~vagreen~loChIJIQBpAG2ahYAR_6128GcTUEo~pr10.01~qt3&ep.item_list_id=list_6&ep.item_list_name=List%206&_et=6010'
};

/** sign_up sent with the official `debug_mode: true` event parameter. */
export const GTAG_DEBUG_MODE_HIT: RecordedCollectRequest = {
  url: 'https://www.google-analytics.com/g/collect?v=2&tid=G-TAGCHECK01&gtm=45je6ae1za200xf1&_p=1792387920252&gcd=13l3l3l3l1l1&npa=0&dma=0&_eu=AAAAAAQ&are=1&cid=1809749667.1792387922&frm=0&pscdl=noapi&rcb=17&sr=800x600&uaa=x86&uab=64&uafvl=Not%252FA)Brand%3B99.0.0.0%7CChromium%3B148.0.7778.97&uam=&uamb=0&uap=Windows&uapv=19.0.0&uaw=0&ul=zh-tw&_s=8&tag_exp=115938465~115938468~118897920~118897930~120385423~120469145~120469153~121246026~121246034&sid=1792387921&sct=1&seg=1&dl=http%3A%2F%2F127.0.0.1%2Fshop%2Fitem%3Fa%3D1%26b%3Dtwo%2520words&dt=Shoes%20%26%20Bags%20%231&en=sign_up&_ee=1&ep.method=email&ep.debug_mode=true&_et=6018&tfd=48797',
  body: ''
};
