<template>
	<div id="app">
		<el-upload v-if="port" action="#" :http-request="fileSeclected" :show-file-list="false" multiple drag
			style="width: 100%" @click="clickUpload">
			<div class="header" style="padding: 15px">
				<div>
					<el-button id="upload" type="primary" round>分享文件</el-button>
					<el-button type="success" round @click="generateQrcode(`${baseUrl}`)">聚合分享</el-button>
					<el-button type="danger" round @click="batchRemove" :disabled="!multipleSelection.length">批量取消
					</el-button>
					<el-button icon="el-icon-setting" circle @click="showSettings"></el-button>
				</div>
				<div>
					<el-form label-width="80px">
						<el-form-item label="网卡">
							<el-select v-model="usingHost" placeholder="请选择网卡" @click="checkHosts" @change="hostChange">
								<el-option v-for="item in hosts" :key="item" :label="item" :value="item"></el-option>
							</el-select>
						</el-form-item>
					</el-form>
				</div>
			</div>
			<el-table ref="multipleTableRef" :data="tableData" style="width: 100%" :height="tableHeight"
				:row-class-name="tableRowClassName" @selection-change="handleSelectionChange">
				<el-table-column type="selection" width="55" />
				<el-table-column prop="path" label="文件路径">
					<template #default="scope">
						<el-link @click="openDir(scope.row.path)">
							{{
									scope.row.path
							}}
						</el-link>
					</template>
				</el-table-column>
				<el-table-column prop="url" label="下载链接">
					<template #default="scope">
						<el-input type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" placeholder="请输入内容"
							:value="`${baseUrl}${scope.row.url}`" readonly></el-input>
					</template>
				</el-table-column>
				<el-table-column label="文件大小" width="100">
					<template #default="scope">
						<el-tag>{{ showSize(scope.row.size) }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="操作" width="250">
					<template #default="scope">
						<div class="actions">
							<el-button size="mini" class="qrcode_btn" @click="
								generateQrcode(
									`${baseUrl}${scope.row.url}`
								)
							">
								<svg t="1635393162072" viewBox="0 0 1024 1024" version="1.1"
									xmlns="http://www.w3.org/2000/svg" p-id="3761" width="14" height="14">
									<path
										d="M320 64l-256 0 0 256 256 0 0-256zM384 0l0 0 0 384-384 0 0-384 384 0zM128 128l128 0 0 128-128 0zM960 64l-256 0 0 256 256 0 0-256zM1024 0l0 0 0 384-384 0 0-384 384 0zM768 128l128 0 0 128-128 0zM320 704l-256 0 0 256 256 0 0-256zM384 640l0 0 0 384-384 0 0-384 384 0zM128 768l128 0 0 128-128 0zM448 0l64 0 0 64-64 0zM512 64l64 0 0 64-64 0zM448 128l64 0 0 64-64 0zM512 192l64 0 0 64-64 0zM448 256l64 0 0 64-64 0zM512 320l64 0 0 64-64 0zM448 384l64 0 0 64-64 0zM448 512l64 0 0 64-64 0zM512 576l64 0 0 64-64 0zM448 640l64 0 0 64-64 0zM512 704l64 0 0 64-64 0zM448 768l64 0 0 64-64 0zM512 832l64 0 0 64-64 0zM448 896l64 0 0 64-64 0zM512 960l64 0 0 64-64 0zM960 512l64 0 0 64-64 0zM64 512l64 0 0 64-64 0zM128 448l64 0 0 64-64 0zM0 448l64 0 0 64-64 0zM256 448l64 0 0 64-64 0zM320 512l64 0 0 64-64 0zM384 448l64 0 0 64-64 0zM576 512l64 0 0 64-64 0zM640 448l64 0 0 64-64 0zM704 512l64 0 0 64-64 0zM768 448l64 0 0 64-64 0zM832 512l64 0 0 64-64 0zM896 448l64 0 0 64-64 0zM960 640l64 0 0 64-64 0zM576 640l64 0 0 64-64 0zM640 576l64 0 0 64-64 0zM704 640l64 0 0 64-64 0zM832 640l64 0 0 64-64 0zM896 576l64 0 0 64-64 0zM960 768l64 0 0 64-64 0zM576 768l64 0 0 64-64 0zM640 704l64 0 0 64-64 0zM768 704l64 0 0 64-64 0zM832 768l64 0 0 64-64 0zM896 704l64 0 0 64-64 0zM960 896l64 0 0 64-64 0zM640 832l64 0 0 64-64 0zM704 896l64 0 0 64-64 0zM768 832l64 0 0 64-64 0zM832 896l64 0 0 64-64 0zM640 960l64 0 0 64-64 0zM768 960l64 0 0 64-64 0zM896 960l64 0 0 64-64 0z"
										p-id="3762" fill="#409EFF" />
								</svg>
							</el-button>
							<el-button size="mini" plain @click.prevent="copyLink(scope.row.url)">复制链接</el-button>
							<el-button type="danger" size="mini" plain @click.prevent="cancelShare(scope.row)">取消共享
							</el-button>
						</div>
					</template>
				</el-table-column>
			</el-table>
			<!-- 二维码弹窗口 -->
			<el-dialog title="二维码分享" v-model="dialogVisible" width="50%" top="3vh">
				<div style="width: 100%; height: 100%; text-align: center">
					<qrcode-vue :value="sharingUrl" :size="300" level="H" />
				</div>
				<div class="share_url">
					<el-input type="textarea" :autosize="{ minRows: 1, maxRows: 4 }" :value="sharingUrl" readonly>
					</el-input>
				</div>
				<template #footer></template>
			</el-dialog>
			<!-- 抽屉 -->
			<el-drawer title="设置" v-model="isShowSettings" direction="ltr" destroy-on-close>
				<el-form :inline="true" class="demo-form-inline">
					<el-form-item label="端口">
						<el-input v-model="custom_port" placeholder="自定义端口"></el-input>
					</el-form-item>
					<el-form-item>
						<el-button type="primary" @click="save">保存</el-button>
					</el-form-item>
				</el-form>
			</el-drawer>
		</el-upload>
		<el-skeleton style="padding: 15px" v-else />
	</div>
</template>
<script lang="ts">
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
			setPort: any;
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
</script>
<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { onMounted, reactive, ref, Ref, computed } from 'vue';
import QrcodeVue from 'qrcode.vue';
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
	await window.api.add(file);
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
const usingHost: Ref<string> = ref('');
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
	window.utools.copyText(
		`${baseUrl}${link}`
	);
	ElMessage.success('复制成功');
};
// 点击表格
let clickedButton = false;
const clickUpload = (e: any) => {
	const tagsName = e.path.map((el: any) => {
		if (el.id === 'upload') {
			clickedButton = true;
			const inputs =
				document.getElementsByClassName('el-upload__input');
			const upload: HTMLElement = inputs[0] as HTMLElement;
			if (upload) upload.click();
		}
		return el && el.tagName;
	});
	if (tagsName.includes('INPUT')) {
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
		if (!ipAddresses.length) ElMessage.error('获取网卡出错');
		hosts.length = 0;
		hosts.push(...ipAddresses);
		const cache = localStorage.getItem('HOST_CACHE')
		if (cache && hosts.includes(cache)) {
			usingHost.value = cache;
		} else {
			const normalHosts = hosts.filter((o: string) =>
				o.startsWith('192.168')
			);
			if (normalHosts.length) usingHost.value = normalHosts[0];
			else usingHost.value = hosts[0];
		}
	} else {
		ElMessage.error('程序加载出错');
	}
};
const checkHosts = async () => {
	if (!hosts.length) await GetIpAddresses();
};
const hostChange = async () => {
	localStorage.setItem('HOST_CACHE', usingHost.value)
}
// 显示大小
const showSize = (size: number) => {
	if (!size) return '未知';
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
// settings
const custom_port = ref(0)
const isShowSettings = ref(false)
const showSettings = () => {
	custom_port.value = port.value;
	isShowSettings.value = true;
}
const save = () => {
	window.api?.setPort(custom_port.value)
	ElMessage.success('设置成功, 插件重启后生效')
}
const addFiles = (payload: Array<any>) => {
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
const tableRowClassName = (scope: any) => {
	const row: File = scope.row;
	if (row.recently) return 'recently';
	return '';
};
// 二维码
const dialogVisible = ref(false);
const sharingUrl = ref('');
const generateQrcode = (str: string) => {
	sharingUrl.value = str;
	console.log(str);
	dialogVisible.value = true;
};
const started = ref(false);
onMounted(async () => {
	// 读取进入参数
	window.utools.onPluginEnter(({ type, payload }: any) => {
		if (type === 'files') addFiles(payload);
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
			ElMessage.error('服务不可用 ' + e);
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
// 生成访问链接
const baseUrl = computed(() => (`http://${usingHost.value.includes(':') ? `[${usingHost.value}]` : usingHost.value}:${port.value}`))

// 多选
const multipleTableRef = ref<InstanceType<any>>()
const multipleSelection = ref<any[]>([])
const handleSelectionChange = (val: any[]) => {
	multipleSelection.value = val
}
// 批量删除
const batchRemove = async () => {
	for (const row of multipleSelection.value) {
		cancelShare(row)
	}
	multipleSelection.value = []
}

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

.actions {
	width: 100%;
	height: 100%;
	overflow: hidden;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
}

.qrcode_btn {
	height: 28px !important;
}

.share_url {
	width: 90%;
	padding: 30px 5% 0 5%;
}
</style>
