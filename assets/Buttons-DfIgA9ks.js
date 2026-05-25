import{o as e}from"./rolldown-runtime-Bhmf7a9N.js";import{a as t,s as n}from"./vendor-react-DQ_4RZFE.js";var r=e(n(),1),i=t(),a=(0,r.memo)((0,r.forwardRef)(({active:e,onClick:t,children:n},r)=>(0,i.jsx)(`button`,{ref:r,onClick:t,className:`text-white font-bold py-2 px-4 rounded transition-colors ${e?`bg-green-800`:`bg-gray-500 hover:bg-blue-600`}`,children:n}))),o=(0,r.memo)(({onClick:e,disabled:t,children:n,colorClass:r=`bg-blue-500 hover:bg-blue-600`,shadowClass:a=`shadow-[0_4px_0_0_theme(colors.blue.700)]`,flashing:o=!1})=>(0,i.jsx)(`button`,{onClick:e,disabled:t,className:`
        ${r} text-white font-bold py-2 px-4 rounded-lg
        transition-all duration-75 relative
        ${t?`opacity-50 cursor-not-allowed translate-y-[2px]`:`active:translate-y-[2px] active:shadow-none ${a}`}
        ${o?`animate-flash`:``}
      `,style:{display:`inline-block`,verticalAlign:`middle`},children:n}));export{a as n,o as t};