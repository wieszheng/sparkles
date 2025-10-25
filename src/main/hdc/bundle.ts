import types from "licia/types";

import map from "licia/map";
import startWith from "licia/startWith";
import filter from "licia/filter";
import contain from "licia/contain";
import { shell } from "./utils";
import { getClient } from "./index";
import trim from "licia/trim";
import log from "electron-log";

const getBundles = async (connectKey, system = true) => {
  const client = getClient();
  const result = await shell(client, connectKey, "bm dump -a");

  const output = Array.isArray(result) ? result.join("\n") : result;
  const bundles = map(trim(output).split("\n").slice(1), (line) => trim(line));

  return system
    ? bundles
    : filter(bundles, (bundle) => !isSystemBundle(bundle));
};

function isSystemBundle(bundle: string) {
  const sysBundlePrefixs = [
    "com.huawei.hmos",
    "com.huawei.hms",
    "com.huawei.msdp",
    "com.ohos",
  ];
  for (let i = 0, len = sysBundlePrefixs.length; i < len; i++) {
    if (startWith(bundle, sysBundlePrefixs[i])) {
      return true;
    }
  }

  if (
    contain(
      [
        "ohos.global.systemres",
        "com.huawei.associateassistant",
        "com.huawei.batterycare",
        "com.huawei.shell_assistant",
        "com.usb.right",
      ],
      bundle,
    )
  ) {
    return true;
  }

  return false;
}

interface BundleInfo {
  bundleName: string;
  versionName: string;
  icon: string;
  label: string;
  system: boolean;
  apiTargetVersion: number;
  vendor: string;
  installTime: number;
  releaseType: string;
  mainAbility?: string;
}

const getBundleInfos = async (connectKey, bundleNames) => {
  const result: BundleInfo[] = [];
  const client = getClient();
  const dumpInfos = await shell(
    client,
    connectKey,
    map(bundleNames, (name) => `bm dump -n ${name}`),
  );
  const infos = map(dumpInfos, (dump) => {
    const lines = dump.split("\n");
    return JSON.parse(lines.slice(1).join("\n"));
  });

  for (let i = 0, len = bundleNames.length; i < len; i++) {
    const bundleName = bundleNames[i];
    const bundleInfo: BundleInfo = {
      bundleName,
      label: bundleName,
      icon: "",
      system: false,
      versionName: "",
      apiTargetVersion: 0,
      vendor: "",
      installTime: 0,
      releaseType: "",
    };

    const info = infos[i];
    const applicationInfo = info.applicationInfo;
    bundleInfo.system = applicationInfo.isSystemApp;
    bundleInfo.versionName = applicationInfo.versionName;
    bundleInfo.apiTargetVersion = applicationInfo.apiTargetVersion;
    bundleInfo.vendor = applicationInfo.vendor;
    bundleInfo.installTime = info.installTime;
    bundleInfo.releaseType = info.releaseType;

    const mainEntry = info.mainEntry;
    if (mainEntry) {
      const mainModuleInfo =
        info.hapModuleInfos[info.hapModuleNames.indexOf(mainEntry)];
      bundleInfo.mainAbility = mainModuleInfo.mainAbility;
    }

    if (!bundleInfo.system && !startWith(bundleName, "com.huawei")) {
      try {
        const onlineInfo = await getOnlineBundleInfo(bundleName);
        if (onlineInfo.name) {
          bundleInfo.label = onlineInfo.name;
        }
        if (onlineInfo.icon) {
          bundleInfo.icon = onlineInfo.icon;
        }
      } catch (e) {
        log.error(e);
      }
    }
    result.push(bundleInfo);
  }

  return result;
};

const INFO_URL = "https://web-drcn.hispace.dbankcloud.com/edge/webedge/appinfo";
const onlineInfos: types.PlainObj<any> = {};
async function getOnlineBundleInfo(bundleName: string) {
  if (onlineInfos[bundleName]) {
    return onlineInfos[bundleName];
  }

  log.info("get online bundle info", bundleName);
  const res = await fetch(INFO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pkgName: bundleName,
      appId: bundleName,
      locale: "zh_CN",
      countryCode: "CN",
      orderApp: 1,
    }),
  });
  const data = await res.json();
  onlineInfos[bundleName] = data;

  return data;
}

const installBundle = async (connectKey, hap) => {
  const client = getClient();
  const target = client.getTarget(connectKey);
  await target.install(hap);
};

const startBundle = async (connectKey, bundleName, ability) => {
  const client = getClient();
  await shell(client, connectKey, `aa start -a ${ability} -b ${bundleName}`);
};

const stopBundle = async (connectKey, bundleName) => {
  const client = getClient();
  await shell(client, connectKey, `aa force-stop ${bundleName}`);
};

const cleanBundleData = async (connectKey, bundleName) => {
  const client = getClient();
  await shell(client, connectKey, `bm clean -n ${bundleName} -d`);
};

const cleanBundleCache = async (connectKey, bundleName) => {
  const client = getClient();
  await shell(client, connectKey, `bm clean -n ${bundleName} -c`);
};

const uninstallBundle = async (connectKey, bundleName) => {
  const target = getClient().getTarget(connectKey);
  await target.uninstall(bundleName);
};

const getTopBundle = async (connectKey) => {
  const client = getClient();
  const abilityInfo = await shell(client, connectKey, "aa dump -a");
  const output = Array.isArray(abilityInfo)
    ? abilityInfo.join("\n")
    : abilityInfo;
  const lines = map(output.split("\n"), (line) => trim(line));

  let name = "";
  let pid = 0;
  let state = "";
  for (let i = 0, len = lines.length; i < len; i++) {
    const line = lines[i];
    if (startWith(line, "process name")) {
      name = line.slice("process name [".length, -1);
    } else if (startWith(line, "pid")) {
      const pidMatch = line.match(/pid #(\d+)/);
      if (pidMatch) {
        pid = parseInt(pidMatch[1], 10);
      }
    } else if (startWith(line, "state")) {
      if (line === "state #FOREGROUND" && !isSystemBundle(name)) {
        state = "foreground";
        break;
      }
    }
  }
  if (state !== "foreground") {
    return {
      name: "",
      pid: 0,
    };
  }

  return {
    name,
    pid,
  };
};

export {
  getBundles,
  getBundleInfos,
  installBundle,
  startBundle,
  stopBundle,
  cleanBundleData,
  cleanBundleCache,
  uninstallBundle,
  getTopBundle,
};
