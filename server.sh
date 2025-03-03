#!/bin/bash

# Farben für Terminal-Output
GREEN="\033[0;32m"
BLUE="\033[0;34m"
RED="\033[0;31m"
RESET="\033[0m"

# Standard-Port
PORT=8000
if [ $# -eq 1 ] && [[ $1 =~ ^[0-9]+$ ]]; then
    PORT=$1
fi

echo -e "${GREEN}Lokaler Server${RESET}"
echo "------------------------------"

# IP-Adresse für Netzwerkzugriff ermitteln
IP_ADDRESS=$(ip addr | grep -E "inet .* global" | awk '{print $2}' | cut -d/ -f1 | head -n1 || hostname -I | awk '{print $1}')

# Server mit Python 3 starten
if command -v python3 &>/dev/null; then
    echo -e "${BLUE}Starte Python 3 HTTP Server auf Port $PORT...${RESET}"
    echo -e "${GREEN}Server läuft!${RESET}"
    echo -e "Lokaler Zugriff: ${BLUE}http://localhost:$PORT${RESET}"

    if [ ! -z "$IP_ADDRESS" ]; then
        echo -e "Netzwerk-Zugriff: ${BLUE}http://$IP_ADDRESS:$PORT${RESET}"
    fi

    echo "Drücke [Strg+C] zum Beenden."
    echo "------------------------------"

    python3 -m http.server $PORT
    exit 0
fi

# Alternativen testen, falls Python 3 nicht vorhanden ist
if command -v php &>/dev/null; then
    echo -e "${BLUE}Python 3 nicht gefunden. Starte PHP Server...${RESET}"
    echo -e "${GREEN}Server läuft!${RESET}"
    echo -e "Lokaler Zugriff: ${BLUE}http://localhost:$PORT${RESET}"
    if [ ! -z "$IP_ADDRESS" ]; then
        echo -e "Netzwerk-Zugriff: ${BLUE}http://$IP_ADDRESS:$PORT${RESET}"
    fi
    echo "Drücke [Strg+C] zum Beenden."
    php -S 0.0.0.0:$PORT
    exit 0
fi

if command -v python &>/dev/null; then
    echo -e "${BLUE}Python 3 nicht gefunden. Starte Python 2 Server...${RESET}"
    echo -e "${GREEN}Server läuft!${RESET}"
    echo -e "Lokaler Zugriff: ${BLUE}http://localhost:$PORT${RESET}"
    if [ ! -z "$IP_ADDRESS" ]; then
        echo -e "Netzwerk-Zugriff: ${BLUE}http://$IP_ADDRESS:$PORT${RESET}"
    fi
    echo "Drücke [Strg+C] zum Beenden."
    python -m SimpleHTTPServer $PORT
    exit 0
fi

# Wenn alles fehlschlägt, versuche Node.js
if command -v npx &>/dev/null; then
    echo -e "${BLUE}Andere Server nicht gefunden. Starte Node.js http-server...${RESET}"
    echo -e "${GREEN}Server läuft!${RESET}"
    echo -e "Lokaler Zugriff: ${BLUE}http://localhost:$PORT${RESET}"
    if [ ! -z "$IP_ADDRESS" ]; then
        echo -e "Netzwerk-Zugriff: ${BLUE}http://$IP_ADDRESS:$PORT${RESET}"
    fi
    echo "Drücke [Strg+C] zum Beenden."
    npx http-server -p $PORT -c-1 --cors
    exit 0
fi

# Keine Server-Option verfügbar
echo -e "${RED}Fehler: Kein Webserver (Python 3, PHP, Python 2, Node.js) gefunden.${RESET}"
echo "Installiere einen Webserver mit: sudo apt install python3"
exit 1
