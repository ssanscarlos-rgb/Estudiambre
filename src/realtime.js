import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { apiPost } from "./api";

// Tiempo real de la campana (Azure SignalR en modo Serverless).
// 1. POST notificaciones/negotiate (por APIM, con el token de Google) devuelve
//    { url, accessToken }: a qué hub de Azure SignalR conectarse y un pase
//    firmado que identifica al usuario (su `sub`).
// 2. El navegador se conecta directo a Azure SignalR (APIM Consumption no deja
//    pasar WebSocket) y escucha el evento "notificacion".
// El pase dura ~1 h: si vence, accessTokenFactory vuelve a negociar.

const negociar = () => apiPost("notificaciones/negotiate", {});

function venceEn(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp * 1000;
  } catch {
    return 0;
  }
}

export async function conectarNotificaciones({ onNotificacion, onReconectado, onCerrada }) {
  const inicial = await negociar();
  let token = inicial.accessToken;

  const conexion = new HubConnectionBuilder()
    .withUrl(inicial.url, {
      // Reutiliza el pase mientras le quede más de un minuto; si no, pide otro.
      accessTokenFactory: async () => {
        if (Date.now() < venceEn(token) - 60_000) return token;
        token = (await negociar()).accessToken;
        return token;
      },
    })
    .withAutomaticReconnect([0, 2000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  conexion.on("notificacion", onNotificacion);
  conexion.onreconnected(() => onReconectado?.());
  conexion.onclose((error) => onCerrada?.(error));

  await conexion.start();
  return conexion;
}
