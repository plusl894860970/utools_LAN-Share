<template>
  <div id="app">
    <el-upload
      v-if="port"
      action="#"
      :http-request="fileSeclected"
      :show-file-list="false"
      multiple
      drag
      style="width: 100%"
      @click="clickUpload"
    >
      <div class="header" style="padding: 15px">
        <el-button id="upload" type="primary" round>分享文件</el-button>
        <div>
          <el-form label-width="80px">
            <el-form-item label="网卡">
              <el-select
                v-model="usingHost"
                placeholder="请选择网卡"
                @click="checkHosts"
              >
                <el-option
                  v-for="item in hosts"
                  :key="item"
                  :label="item"
                  :value="item"
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <el-table
        :data="tableData"
        style="width: 100%"
        :height="tableHeight"
        :row-class-name="tableRowClassName"
      >
        <!-- <el-table-column prop="name" label="文件名" /> -->
        <el-table-column prop="path" label="文件路径">
          <template #default="scope">
            <el-link @click="openDir(scope.row.path)">{{
              scope.row.path
            }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="url" label="下载链接">
          <template #default="scope">
            <el-input
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder="请输入内容"
              :value="`http://${usingHost}:${port}${scope.row.url}`"
              readonly
            >
            </el-input>
          </template>
        </el-table-column>
        <el-table-column label="文件大小" width="100">
          <template #default="scope">
            <el-tag>
              {{ showSize(scope.row.size) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button
              size="mini"
              plain
              @click.prevent="copyLink(scope.row.url)"
              >复制链接</el-button
            >
            <el-button
              type="danger"
              size="mini"
              plain
              @click.prevent="cancelShare(scope.row)"
              >取消共享</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-upload>
    <el-skeleton style="padding: 15px" v-else />
  </div>
</template>
<script lang="ts">
import { ElMessage } from "element-plus";
import { onMounted, reactive, ref, Ref } from "vue";
interface File {
  name: string;
  url: string;
  path: string;
  size: number;
  recently?: boolean;
}
interface FileParam {
  isDirectory: boolean;
  isFile: boolean;
  name: string;
  path: string;
}
declare global {
  interface Window {
    api?: {
      startServer: any;
      stopServer: any;
      add: any;
      remove: any;
      clear: any;
      values: any;
      getIPAddresses: any;
      getPort: any;
    };
    utools?: {
      onPluginReady: any;
      setExpendHeight: any;
      copyText: any;
      shellShowItemInFolder: any;
      onPluginEnter: any;
    };
  }
}
export default {
  setup() {
    const files: Array<File> = [];
    const tableData = reactive(files);
    const getFiles = async () => {
      if (!window.api?.values) return;
      tableData.length = 0;
      const { data } = await window.api.values();
      tableData.push(...data);
    };
    const addFile = async (file: File) => {
      if (!window.api?.add) return;
      tableData.unshift(file);
      file.recently = true;
      setTimeout(() => {
        setTableHeight();
      }, 500);
      await window.api.add(JSON.parse(JSON.stringify(file)));
    };
    const cancelShare = async (row: File) => {
      if (!window.api?.remove) return;
      await window.api.remove(row);
      const newTableData = tableData.filter((o) => o.name !== row.name);
      tableData.length = 0;
      tableData.push(...newTableData);
    };
    const ips: Array<string> = [];
    const hosts = reactive(ips);
    const usingHost: Ref<string> = ref("");
    // 选择文件
    const fileSeclected = async (e: any) => {
      const { file } = e;
      const { name, size, path } = file;
      const obj: File = {
        name,
        size,
        path,
        url: `/download/${encodeURIComponent(name)}`,
      };
      await addFile(obj);
    };
    const ready = ref(false);
    // 复制
    const copyLink = (link: string) => {
      window.utools.copyText(`http://${usingHost.value}:${port.value}${link}`);
      ElMessage.success("复制成功");
    };
    // 点击表格
    let clickedButton = false;
    const clickUpload = (e: any) => {
      const tagsName = e.path.map((el: any) => {
        if (el.id === "upload") {
          clickedButton = true;
          const inputs = document.getElementsByClassName("el-upload__input");
          const upload: HTMLElement = inputs[0] as HTMLElement;
          if (upload) upload.click();
        }
        return el && el.tagName;
      });
      if (tagsName.includes("INPUT")) {
        if (clickedButton) clickedButton = false;
        else e.preventDefault();
      } else {
        clickedButton = false;
        e.preventDefault();
      }
    };
    // 获取网卡信息
    const GetIpAddresses = async () => {
      if (window.api?.getIPAddresses) {
        const ipAddresses: Array<string> =
          (await window.api.getIPAddresses()) || [];
        if (!ipAddresses.length) ElMessage.error("获取网卡出错");
        hosts.length = 0;
        hosts.push(...ipAddresses);
        const normalHosts = hosts.filter((o: string) =>
          o.startsWith("192.168")
        );
        if (normalHosts.length) usingHost.value = normalHosts[0];
        else usingHost.value = hosts[0];
      } else {
        ElMessage.error("程序加载出错");
      }
    };
    const checkHosts = async () => {
      if (!hosts.length) await GetIpAddresses();
    };
    // 显示大小
    const showSize = (size: number) => {
      const GbEdge = 1024 * 1000000;
      const MbEdge = 1024 * 1000;
      const KbEdge = 1024;
      if (size > GbEdge) {
        // GB
        return `${(size / GbEdge).toFixed(2)}GB`;
      } else if (size > MbEdge) {
        // Mb
        return `${(size / MbEdge).toFixed(2)}MB`;
      } else if (size > KbEdge) {
        // kb
        return `${(size / KbEdge).toFixed(2)}KB`;
      } else {
        // B
        return `${size.toFixed(2)}B`;
      }
    };
    // 显示文件夹
    const openDir = (path: string) => {
      window.utools.shellShowItemInFolder(path);
    };
    // tableHeight
    const tableHeight = ref(400);
    const setTableHeight = () => {
      tableHeight.value = document.body.clientHeight - 70;
    };
    // port
    const port = ref(0);
    const GetPort = async () => {
      if (window.api?.getPort) {
        port.value = await window.api.getPort();
      }
    };
    const addFiles = (payload) => {
      if (!started.value) {
        setTimeout(() => {
          addFiles(payload);
        }, 500);
        return;
      }
      for (const item of payload) {
        const file: FileParam = item;
        if (file.isFile) {
          // 添加到共享
          const obj: File = {
            name: file.name,
            size: 0,
            path: file.path,
            url: `/download/${encodeURIComponent(file.name)}`,
          };
          addFile(obj);
        }
      }
    };
    const tableRowClassName = (scope) => {
      const row: File = scope.row;
      if (row.recently) return "recently";
      return "";
    };
    const started = ref(false);
    onMounted(async () => {
      // 读取进入参数
      window.utools.onPluginEnter(({ type, payload }) => {
        if (type === "files") addFiles(payload);
      });
      window.utools.onPluginReady(() => {
        ready.value = true;
      });
      while (!ready.value) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (window.api?.startServer) {
        try {
          await window.api.startServer();
        } catch (e) {
          ElMessage.error("服务不可用 " + e);
        }
      }
      await GetIpAddresses();
      await GetPort();
      await getFiles();
      // 设置table高度
      setTableHeight();
      window.onresize = setTableHeight;
      started.value = true;
    });
    return {
      tableData,
      cancelShare,
      fileSeclected,
      copyLink,
      clickUpload,
      usingHost,
      hosts,
      checkHosts,
      showSize,
      openDir,
      tableHeight,
      port,
      tableRowClassName,
    };
  },
};
</script>

<style>
* {
  padding: 0;
  margin: 0;
}
#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height: 40px;
  overflow: hidden;
}
.el-upload {
  width: 100vw !important;
}
.el-upload-dragger {
  width: 100% !important;
  height: 100vh !important;
  text-align: left !important;
  border: none !important;
  cursor: default !important;
}
.recently {
  --el-table-tr-background-color: rgb(225, 243, 216);
}
</style>
