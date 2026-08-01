import{i as e,s as t}from"./preload-helper-CT_b8DTk.js";import{t as n}from"./react-B7Te67-h.js";import{t as r}from"./jsx-runtime-DqZldVDK.js";import{t as i}from"./Text-BpGwTz5f.js";import{t as a}from"./Button-DhJOBiHb.js";import{t as o}from"./Button-Lye-Vx_n.js";import{t as s}from"./Heading-D6ooulfW.js";import{i as c,o as l,t as u}from"./Stack-CmI4wWVz.js";import{n as d,t as f}from"./Text-CXcwWRQU.js";import{Cn as p,Tn as m,t as h}from"./src-Cupii2Te.js";var g,_,v,y,b,x;e((()=>{g=t(n()),h(),o(),d(),u(),f(),_=r(),v={title:`Lab/Tour`,component:m,tags:[`autodocs`],parameters:{layout:`fullscreen`},decorators:[e=>(0,_.jsx)(`div`,{style:{minHeight:480,padding:32},children:(0,_.jsx)(e,{})})]},y={render:()=>{let[e,t]=(0,g.useState)(!1),n=(0,g.useRef)(null),r=(0,g.useRef)(null),i=(0,g.useRef)(null);return(0,_.jsxs)(c,{gap:4,children:[(0,_.jsxs)(l,{gap:2,children:[(0,_.jsx)(a,{ref:n,variant:`secondary`,label:`Save`}),(0,_.jsx)(a,{ref:r,variant:`secondary`,label:`Share`}),(0,_.jsx)(a,{ref:i,variant:`secondary`,label:`Settings`})]}),(0,_.jsx)(a,{label:`Start tour`,onClick:()=>t(!0)}),(0,_.jsxs)(m,{isActive:e,hasBackdrop:!0,isStepCountShown:!0,onDismiss:()=>t(!1),children:[(0,_.jsx)(p,{targetRef:n,heading:`Save your work`,children:`Changes save automatically to the cloud as you go.`}),(0,_.jsx)(p,{targetRef:r,heading:`Share with your team`,children:`Invite teammates and manage access from here.`}),(0,_.jsx)(p,{targetRef:i,heading:`Tune your setup`,children:`Adjust preferences and defaults in Settings.`})]})]})}},b={render:()=>{let[e,t]=(0,g.useState)(!1),n=(0,g.useRef)(null);return(0,_.jsxs)(c,{gap:4,children:[(0,_.jsx)(s,{level:3,children:`Feature callout`}),(0,_.jsx)(i,{type:`body`,children:`A single-step tour with no dimmed background — a lightweight coachmark.`}),(0,_.jsx)(a,{ref:n,variant:`secondary`,label:`New feature`}),(0,_.jsx)(a,{label:`Highlight it`,onClick:()=>t(!0)}),(0,_.jsx)(m,{isActive:e,onDismiss:()=>t(!1),children:(0,_.jsx)(p,{targetRef:n,heading:`Try the new feature`,placement:`below`,children:`We just shipped this — click to explore.`})})]})}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [isActive, setIsActive] = useState(false);
    const saveRef = useRef<HTMLButtonElement>(null);
    const shareRef = useRef<HTMLButtonElement>(null);
    const settingsRef = useRef<HTMLButtonElement>(null);
    return <VStack gap={4}>
        <HStack gap={2}>
          <Button ref={saveRef} variant="secondary" label="Save" />
          <Button ref={shareRef} variant="secondary" label="Share" />
          <Button ref={settingsRef} variant="secondary" label="Settings" />
        </HStack>

        <Button label="Start tour" onClick={() => setIsActive(true)} />

        <Tour isActive={isActive} hasBackdrop isStepCountShown onDismiss={() => setIsActive(false)}>
          <TourStep targetRef={saveRef} heading="Save your work">
            Changes save automatically to the cloud as you go.
          </TourStep>
          <TourStep targetRef={shareRef} heading="Share with your team">
            Invite teammates and manage access from here.
          </TourStep>
          <TourStep targetRef={settingsRef} heading="Tune your setup">
            Adjust preferences and defaults in Settings.
          </TourStep>
        </Tour>
      </VStack>;
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [isActive, setIsActive] = useState(false);
    const targetRef = useRef<HTMLButtonElement>(null);
    return <VStack gap={4}>
        <Heading level={3}>Feature callout</Heading>
        <Text type="body">
          A single-step tour with no dimmed background — a lightweight
          coachmark.
        </Text>
        <Button ref={targetRef} variant="secondary" label="New feature" />
        <Button label="Highlight it" onClick={() => setIsActive(true)} />

        <Tour isActive={isActive} onDismiss={() => setIsActive(false)}>
          <TourStep targetRef={targetRef} heading="Try the new feature" placement="below">
            We just shipped this — click to explore.
          </TourStep>
        </Tour>
      </VStack>;
  }
}`,...b.parameters?.docs?.source}}},x=[`Showcase`,`WithoutBackdrop`]}))();export{y as Showcase,b as WithoutBackdrop,x as __namedExportsOrder,v as default};