import editForm from "../form.vue";
import menuSelect from "../menu-select.vue";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { addDialog } from "@/components/ReDialog";
import type { FormItemProps } from "../utils/types";
import type { PaginationProps } from "@pureadmin/table";
import { reactive, ref, onMounted, h, toRaw } from "vue";
import {
  getRoleList,
  deleteRole,
  addRole,
  updateRole
} from "@/api/system/roles";
import { EnsureSuccess } from "@/utils/http/extend";

export function useRole() {
  const form = reactive({
    roleName: null,
    remark: null
  });
  const formRef = ref();
  const dataList = ref([]);
  const loading = ref(true);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });
  const columns: TableColumnList = [
    {
      label: "角色名称",
      prop: "roleName"
    },
    {
      label: "备注",
      prop: "remark",
      minWidth: 150
    },
    {
      label: "创建时间",
      prop: "createdOn",
      minWidth: 180
    },
    {
      label: "操作",
      fixed: "right",
      width: 240,
      slot: "operation"
    }
  ];

  function handleSizeChange(val: number) {
    console.log(`${val} items per page`);
  }

  function handleCurrentChange(val: number) {
    console.log(`current page: ${val}`);
  }

  function handleSelectionChange(val) {
    console.log("handleSelectionChange", val);
  }

  async function onSearch() {
    loading.value = true;
    const { result: data } = await getRoleList(toRaw(form));
    dataList.value = data.rows;
    pagination.total = data.total;
    pagination.pageSize = data.page;
    pagination.currentPage = data.size;

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  function openDialog(title = "新增", row?: FormItemProps | any) {
    addDialog({
      title: `${title}用户`,
      props: {
        formInline: {
          id: row?.id ?? "",
          name: row?.roleName ?? "",
          remark: row?.remark ?? ""
        }
      },
      width: "40%",
      draggable: true,
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        FormRef.validate(valid => {
          if (valid) {
            console.log("curData", curData);
            // 表单规则校验通过
            if (title === "新增") {
              addRole(curData).then(res => {
                if (EnsureSuccess(res)) {
                  message(res.message, { type: "success" });
                  done(); // 关闭弹框
                  onSearch(); // 刷新表格数据
                } else {
                  message(res.message, { type: "error" });
                }
              });
            } else {
              updateRole(curData).then(res => {
                if (EnsureSuccess(res)) {
                  message(res.message, { type: "success" });
                  done();
                  onSearch();
                } else {
                  message(res.message, { type: "error" });
                }
              });
            }
          }
        });
      }
    });
  }

  /** 菜单权限 */
  function handleMenu(id) {
    addDialog({
      title: "分配菜单",
      props: { id: id },
      width: "50%",
      draggable: true,
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(menuSelect)
    });
  }

  function removeRole(row) {
    ElMessageBox.confirm("确定删除" + row.roleName + "吗?", "系统提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      dangerouslyUseHTMLString: true,
      draggable: true
    }).then(() => {
      deleteRole({ id: row.id }).then(res => {
        if (EnsureSuccess(res)) {
          message(res.message, { type: "success" });
          onSearch();
        } else {
          message(res.message, { type: "error" });
        }
      });
    });
  }

  /** 数据权限 可自行开发 */
  // function handleDatabase() {}

  onMounted(() => {
    onSearch();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    pagination,
    // buttonClass,
    onSearch,
    resetForm,
    openDialog,
    handleMenu,
    // handleDatabase,
    handleSizeChange,
    handleCurrentChange,
    handleSelectionChange,
    removeRole
  };
}
