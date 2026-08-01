const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./Tooltip-DklWbBNv.js","./rolldown-runtime-DaJ6WEGw.js","./react-BJoyWkjz.js","./jsx-runtime-cM__dR4X.js","./useTooltip-CEpjPvuk.js","./themeProps-DlHa58hS.js","./layerAnimations.stylex-Da83fcE8.js","./tokens.stylex-DK_fi7Kf.js","./useIsomorphicLayoutEffect-BLjA_OV8.js"])))=>i.map(i=>d[i]);
import{a as e,n as t}from"./rolldown-runtime-DaJ6WEGw.js";import{n,t as r}from"./preload-helper-si3HNj2m.js";import{t as i}from"./react-BJoyWkjz.js";import{l as a,n as o,t as s,u as c}from"./themeProps-DlHa58hS.js";import{t as l,x as u,y as d}from"./utils-jTHzKw3y.js";import{_ as f,a as p,c as m,d as h,f as g,g as _,h as v,i as y,l as b,m as x,n as S,o as C,p as w,r as T,s as E,u as D,v as O}from"./Text-BrbTLH6i.js";import{t as k}from"./jsx-runtime-cM__dR4X.js";function A({level:e,type:t,accessibilityLevel:n,color:r=`primary`,display:i=`block`,maxLines:a=0,hasTruncateTooltip:s=!0,wordBreak:l,textWrap:h,justify:y=`start`,hasCapsize:S=!1,hasStrikethrough:k=!1,xstyle:A,className:F,style:I,children:L,ref:R,...z}){let B=P[e],V=n&&n!==e?{"aria-level":n}:{},H=l??(a===1?`break-all`:`break-word`),U=a>0||S?`block`:i,W=p({maxLines:a}),G=typeof s==`string`?s:`above`,K=a>0&&s!==!1&&W.isTruncated,q=(0,j.useRef)(null),J=a>1?{WebkitLineClamp:a}:void 0;return(0,M.jsxs)(M.Fragment,{children:[(0,M.jsx)(B,{ref:d(R,W.ref,q),...u(o(`heading`,{level:e,color:r,...t&&{type:t}}),c(E[T(r)],t?x[t]:w[e],t&&b[t],a===1?_.singleLine:a>1?_.multiLine:D[U],a>0&&O[H],h&&v[h],y!==`start`&&g[y],S&&C.enabled,k&&m.strikethrough,A),F,{...I,...J}),title:K?W.fullText:void 0,...V,...z,children:L}),K&&(0,M.jsx)(j.Suspense,{fallback:null,children:(0,M.jsx)(N,{anchorRef:q,content:(0,M.jsx)(`span`,{...c(f.content),children:W.fullText}),placement:G})})]})}var j,M,N,P,F=t((()=>{j=e(i(),1),a(),h(),y(),S(),l(),s(),M=k(),n(),N=(0,j.lazy)(async()=>r(()=>import(`./Tooltip-DklWbBNv.js`).then(e=>(e.r(),e.n)).then(e=>({default:e.Tooltip})),__vite__mapDeps([0,1,2,3,4,5,6,7,8]),import.meta.url)),P={1:`h1`,2:`h2`,3:`h3`,4:`h4`,5:`h5`,6:`h6`},A.displayName=`Heading`,A.__docgenInfo={description:`Heading - Semantic heading component

Renders headings with semantic HTML (h1-h6) and themed styling.

@example
\`\`\`
<Heading level={1}>Page Title</Heading>
<Heading level={2}>Section</Heading>
<Heading level={2} accessibilityLevel={3}>Sidebar Section</Heading>
<Heading level={1} type="display-1">Hero Title</Heading>
<Heading level={2} type="display-2">$1.2M Revenue</Heading>
<Heading level={2} maxLines={1}>Very Long Section Title...</Heading>
<Heading level={3} color="secondary">Muted Heading</Heading>
\`\`\``,methods:[],displayName:`Heading`,props:{ref:{required:!1,tsType:{name:`ReactRef`,raw:`React.Ref<HTMLHeadingElement>`,elements:[{name:`HTMLHeadingElement`}]},description:`Ref forwarded to the root element`},level:{required:!0,tsType:{name:`union`,raw:`1 | 2 | 3 | 4 | 5 | 6`,elements:[{name:`literal`,value:`1`},{name:`literal`,value:`2`},{name:`literal`,value:`3`},{name:`literal`,value:`4`},{name:`literal`,value:`5`},{name:`literal`,value:`6`}]},description:"Heading level (1-6). Determines the semantic HTML element (h1–h6).\nAlso determines visual styling unless `type` is set."},type:{required:!1,tsType:{name:`union`,raw:`'display-1' | 'display-2' | 'display-3'`,elements:[{name:`literal`,value:`'display-1'`},{name:`literal`,value:`'display-2'`},{name:`literal`,value:`'display-3'`}]},description:`Display type variant. When set, overrides the visual styling from \`level\`
with display-scale sizing (larger, lighter weight, tighter line-height).
The \`level\` still determines the HTML element for accessibility.

Use for hero banners, marketing headlines, and data callouts that need
heading semantics.

@example
\`\`\`
<Heading level={1} type="display-1">Hero Title</Heading>
<Heading level={2} type="display-2">$1.2M Revenue</Heading>
\`\`\``},accessibilityLevel:{required:!1,tsType:{name:`union`,raw:`1 | 2 | 3 | 4 | 5 | 6`,elements:[{name:`literal`,value:`1`},{name:`literal`,value:`2`},{name:`literal`,value:`3`},{name:`literal`,value:`4`},{name:`literal`,value:`5`},{name:`literal`,value:`6`}]},description:"Accessibility level override. When set, the `aria-level` will differ\nfrom the visual `level`. Use this when the visual hierarchy doesn't\nmatch the document outline (e.g., sidebar headings, reused components).\n\n@default Same as `level`\n\n@example\n```\n<Heading level={2} accessibilityLevel={3}>Sidebar Section</Heading>\n```"},color:{required:!1,tsType:{name:`TextColorMap`},description:`Text color.
@default 'primary'`,defaultValue:{value:`'primary'`,computed:!1}},display:{required:!1,tsType:{name:`union`,raw:`'inline' | 'block'`,elements:[{name:`literal`,value:`'inline'`},{name:`literal`,value:`'block'`}]},description:`Display type. Headings default to block.
Note: Silently overridden to 'block' when maxLines > 0 or hasCapsize is true.
@default 'block'`,defaultValue:{value:`'block'`,computed:!1}},maxLines:{required:!1,tsType:{name:`number`},description:`Maximum lines before truncation. 0 = no truncation.
When set, shows tooltip on hover if content is truncated.
@default 0`,defaultValue:{value:`0`,computed:!1}},hasTruncateTooltip:{required:!1,tsType:{name:`union`,raw:`boolean | LayerPlacement`,elements:[{name:`boolean`},{name:`union`,raw:`'above' | 'below' | 'start' | 'end'`,elements:[{name:`literal`,value:`'above'`},{name:`literal`,value:`'below'`},{name:`literal`,value:`'start'`},{name:`literal`,value:`'end'`}]}]},description:`Control tooltip behavior for truncated text.
- \`true\` (default when maxLines > 0): show tooltip at default position
- \`false\`: disable tooltip
- Position value: show tooltip at specific position
@default true`,defaultValue:{value:`true`,computed:!1}},wordBreak:{required:!1,tsType:{name:`union`,raw:`'break-word' | 'break-all'`,elements:[{name:`literal`,value:`'break-word'`},{name:`literal`,value:`'break-all'`}]},description:`Word break behavior for truncated text.
@default 'break-all' for maxLines=1, 'break-word' otherwise`},textWrap:{required:!1,tsType:{name:`union`,raw:`'wrap' | 'nowrap' | 'balance' | 'pretty'`,elements:[{name:`literal`,value:`'wrap'`},{name:`literal`,value:`'nowrap'`},{name:`literal`,value:`'balance'`},{name:`literal`,value:`'pretty'`}]},description:`Text wrapping behavior.`},justify:{required:!1,tsType:{name:`union`,raw:`'start' | 'center' | 'end'`,elements:[{name:`literal`,value:`'start'`},{name:`literal`,value:`'center'`},{name:`literal`,value:`'end'`}]},description:`Text alignment (justification). Uses logical values (start/end)
for i18n/RTL compatibility.
@default 'start'`,defaultValue:{value:`'start'`,computed:!1}},hasCapsize:{required:!1,tsType:{name:`boolean`},description:`Enable optical alignment (text-box-trim).
Forces block display.
@default false`,defaultValue:{value:`false`,computed:!1}},hasStrikethrough:{required:!1,tsType:{name:`boolean`},description:`Strikethrough decoration.
@default false`,defaultValue:{value:`false`,computed:!1}},children:{required:!0,tsType:{name:`ReactNode`},description:`Heading content`}},composes:[`Omit`]}}));export{F as n,A as t};