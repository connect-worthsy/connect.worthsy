/* WORTHSY account: shared Firebase Authentication UI on every page. */
(()=> {
  const firebaseConfig={
    apiKey:"AIzaSyDxBGEZnGnCdUQftwS-QgOVMH5h9WNzecE",
    authDomain:"connect1worthsy.firebaseapp.com",
    projectId:"connect1worthsy",
    storageBucket:"connect1worthsy.firebasestorage.app",
    messagingSenderId:"655885819600",
    appId:"1:655885819600:web:333ab84dac36a82f7408d5",
    measurementId:"G-9Z80CL354X"
  };
  const modalMarkup=`
  <section id="wst-account-layer" class="wst-account-layer" role="dialog" aria-modal="true" aria-labelledby="wst-account-title" aria-hidden="true">
    <div class="wst-account-card">
      <header class="wst-account-head"><div><b id="wst-account-title">YOUR WORTHSY ACCOUNT</b><div style="font-size:12px;color:#666;margin-top:4px">Sign in to save your cart and preferences</div></div><button type="button" id="wst-account-close" class="wst-account-close" aria-label="Close account panel">×</button></header>
      <div class="wst-account-body">
        <button type="button" class="wst-account-provider" id="wst-account-google"><i class="fa-brands fa-google" aria-hidden="true"></i> Continue with Google</button>
        <div style="text-align:center;font-size:11px;color:#888;margin:16px 0">OR CONTINUE WITH EMAIL</div>
        <label for="wst-account-contact" style="font-size:12px;font-weight:700">Email address</label>
        <input id="wst-account-contact" class="wst-account-field" type="email" autocomplete="username" placeholder="you@example.com">
        <label for="wst-account-password" style="font-size:12px;font-weight:700">Password</label>
        <input id="wst-account-password" class="wst-account-field" type="password" autocomplete="current-password" minlength="6" placeholder="At least 6 characters">
        <div class="wst-account-actions" id="wst-account-credentials"><button type="button" id="wst-account-signin">Sign in</button><button type="button" id="wst-account-signup" class="secondary">Create account</button></div>
        <button type="button" id="wst-account-reset" class="wst-account-reset">Forgot password?</button>
        <button type="button" id="wst-account-signout" class="wst-account-provider" hidden>Sign out</button>
        <p id="wst-account-status" class="wst-account-note" role="status" aria-live="polite">Sign in or create an account to continue.</p>
      </div>
    </div>
  </section>`;
  const ready=()=> {
    const trigger=document.getElementById("wst-account-open");
    if(!trigger)return;
    if(!document.getElementById("wst-account-layer"))document.body.insertAdjacentHTML("beforeend",modalMarkup);
    const panel=document.getElementById("wst-account-layer");
    const status=document.getElementById("wst-account-status");
    const email=document.getElementById("wst-account-contact");
    const password=document.getElementById("wst-account-password");
    const credentials=document.getElementById("wst-account-credentials");
    const google=document.getElementById("wst-account-google");
    const signout=document.getElementById("wst-account-signout");
    const label=trigger.querySelector(".wst-account-label");
    const say=(s)=>{if(status)status.textContent=s;};
    const open=()=>{panel.classList.add("open");panel.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";document.getElementById("wst-account-close").focus();};
    const close=()=>{panel.classList.remove("open");panel.setAttribute("aria-hidden","true");document.body.style.overflow="";trigger.focus();};
    trigger.addEventListener("click",open);
    document.getElementById("wst-account-close").addEventListener("click",close);
    panel.addEventListener("click",e=>{if(e.target===panel)close();});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&panel.classList.contains("open"))close();});
    const explain=e=>{
      const map={
        "auth/invalid-email":"Please enter a valid email address.",
        "auth/weak-password":"Choose a password with at least 6 characters.",
        "auth/email-already-in-use":"An account already exists for this email. Please sign in.",
        "auth/invalid-credential":"Email or password is incorrect.",
        "auth/user-not-found":"No account was found. Please create one.",
        "auth/wrong-password":"Email or password is incorrect.",
        "auth/popup-closed-by-user":"Google sign-in was cancelled.",
        "auth/popup-blocked":"Your browser blocked the Google sign-in window. Allow pop-ups and try again.",
        "auth/unauthorized-domain":"This website domain is not authorized in Firebase Authentication settings.",
        "auth/operation-not-allowed":"This sign-in method is not enabled in Firebase Authentication settings.",
        "auth/network-request-failed":"Network error. Check your connection and try again."
      };
      return map[e&&e.code]||(e&&e.message)||"Something went wrong. Please try again.";
    };
    const getAuth=()=>{
      if(!window.firebase||!firebase.auth)throw new Error("Account service did not load. Refresh and try again.");
      if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
      return firebase.auth();
    };
    try{
      const auth=getAuth();
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(()=>{});
      auth.onAuthStateChanged(user=>{
        const signed=!!user;
        if(credentials)credentials.hidden=signed;
        if(google)google.hidden=signed;
        if(signout)signout.hidden=!signed;
        document.getElementById("wst-account-reset").hidden=signed;
        if(label)label.textContent=signed?"Account":"Account";
        trigger.setAttribute("aria-label",signed?"Open your signed-in WORTHSY account":"Sign in or create a WORTHSY account");
        if(signed)say("Signed in as "+(user.displayName||user.email||"your WORTHSY account")+".");
        else say("Sign in or create an account to save your cart and preferences.");
      });
      document.getElementById("wst-account-google").addEventListener("click",async()=>{
        try{say("Opening Google sign-in…");await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());say("Google sign-in successful.");close();}
        catch(e){if(e.code==="auth/popup-blocked"||e.code==="auth/operation-not-supported-in-this-environment"){try{await auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());}catch(x){say(explain(x));}}else say(explain(e));}
      });
      document.getElementById("wst-account-signin").addEventListener("click",async()=>{
        const mail=email.value.trim(),pass=password.value;
        if(!mail||!pass){say("Enter your email address and password.");return;}
        try{say("Signing in…");await auth.signInWithEmailAndPassword(mail,pass);say("Signed in successfully.");close();}
        catch(e){say(explain(e));}
      });
      document.getElementById("wst-account-signup").addEventListener("click",async()=>{
        const mail=email.value.trim(),pass=password.value;
        if(!mail||!pass){say("Enter your email address and choose a password.");return;}
        if(pass.length<6){say("Choose a password with at least 6 characters.");return;}
        try{say("Creating your account…");const result=await auth.createUserWithEmailAndPassword(mail,pass);if(result.user){await result.user.sendEmailVerification();say("Account created. Please verify your email using the link we sent.");}close();}
        catch(e){say(explain(e));}
      });
      document.getElementById("wst-account-reset").addEventListener("click",async()=>{
        const mail=email.value.trim();if(!mail){say("Enter your email address first.");return;}
        try{say("Sending password reset email…");await auth.sendPasswordResetEmail(mail);say("If an account exists for this email, password reset instructions have been sent.");}
        catch(e){say(explain(e));}
      });
      document.getElementById("wst-account-signout").addEventListener("click",async()=>{
        try{await auth.signOut();say("You have signed out.");}catch(e){say(explain(e));}
      });
    }catch(e){say(explain(e));}
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready,{once:true});else ready();
})();