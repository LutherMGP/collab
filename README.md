# Welcome to your Expo app 👋

## Expo GO

1. npx expo start -c

## Build til TestFlight (Apple)

1. npx eas build --platform ios

2. eas submit --platform ios

# Buildtyper 👋

Med den nuværende opsætning af eas.json er følgende implementeret:

1. Miljøbaseret Test-login:
   Ved hjælp af miljøvariabler i eas.json er knapperne til test-login (Bruger, Designer, Admin) kun synlige, når miljøet er sat til udvikling eller preview (med DEVELOPER_MODE: "true").

2. Automatisk Testbrugeroprettelse:
   loginAsTestUser-funktionen i login.tsx tjekker, om en testbruger allerede eksisterer i Firestore. Hvis ikke, oprettes brugeren automatisk i Firestore med den relevante rolle.

3. Begrænset Adgang i TestFlight:
   Ved at sætte DEVELOPER_MODE til false i produktionsindstillingerne i eas.json er knapperne til test-login skjult for alle andre end dig, når appen køres i TestFlight, da DEVELOPER_EMAIL tjekkes i udviklings- og preview-miljøet.

4. Login via Apple og Testbrugere:
   Apple-login er implementeret som hovedlogin, mens loginAsTestUser-funktionen giver dig mulighed for hurtigt at logge ind som forskellige roller under udvikling og test.

Hvad er næste skridt?

1. Test i TestFlight (kan ikke anbefales at benytte!):
   Du kan nu bygge og uploade appen til TestFlight ved hjælp af:

   step 1:
   eas build --profile preview --platform ios

   Når du tester i TestFlight, vil kun du (baseret på DEVELOPER_EMAIL) kunne se test-login-knapperne.

2. Klargøring til Produktion:
   Når du er klar til at frigive appen til produktion, kan du bygge den med:

   step 1:
   eas build --profile production --platform ios

   step 2:
   eas submit --platform ios

   som vil skjule testknapperne for alle, inklusive dig.

   Når du er klar til den endelige produktionsudgivelse, kan du ændre i eas.json:
   • Fjerne DEVELOPER_EMAIL fra production-profilen i eas.json, eller
   • Sætte DEVELOPER_MODE til "false" i produktionsprofilen for at skjule testknapperne for alle, inklusive dig.

   ## Installation: fra repository 'collab'

   • git clone https://github.com/LutherMGP/collab.git
   • cd collab
   • npm install expo

   ## Installation: app relateret

   • npx expo install firebase
   • npx expo install expo-apple-authentication
   • npx expo install @react-native-async-storage/async-storage
   • npx expo install expo-secure-store
   • npx expo install expo-document-picker
   • npx expo install expo-image-manipulator
   • npm install moment

   ## Opstart af iOS Simulator

   • npx expo start -c
